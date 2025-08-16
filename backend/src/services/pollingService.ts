import * as DB from "@shared/types/database";
import { GamesAddedMessage } from "@shared/types/websocket";
import cron, { ScheduledTask } from "node-cron";
import { Server as SocketIOServer } from "socket.io";

import { TournamentRepository } from "../repositories/tournamentRepository";
import { convertFileToDatabase } from "./fileToDatabaseConversions";
import { loadTournamentFile } from "./loadTournamentFile";
import { transformToDomainTournament, transformGameChangesToDomain } from "../utils/domainTransforms";
import * as Domain from "@shared/types/domain";

export class TournamentPollingService {
  private isRunning: boolean;
  private job: ScheduledTask | null;

  constructor(
    private readonly repo: TournamentRepository,
    private readonly io: SocketIOServer,
  ) {
    this.isRunning = false;
    this.job = null;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    // Run every 10 seconds
    this.job = cron.schedule("*/10 * * * * *", async () => {
      try {
        await this.pollActiveTournaments();
      } catch (error) {
        console.error("Error in tournament polling:", error);
      }
    });

    this.isRunning = true;
    console.log("Tournament polling service started");
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log("Tournament polling service stopped");
    }
  }

  private async pollActiveTournaments(): Promise<void> {
    console.log("Tournament polling service is polling...");

    await this.clearExpiredPolls();

    const activeTournaments = await this.repo.findActivePollableWithData();
    for (const { tournament, tournamentData } of activeTournaments) {
      try {
        const newData = await loadTournamentFile(tournamentData.data_url);

        // Use a deep comparison of the data - compare with tournamentData.data, not tournament.data
        if (JSON.stringify(newData) !== JSON.stringify(tournamentData.data)) {
          console.log(`Found new data for ${tournament.id}:${tournament.name}`);

          // Convert file data to database format
          const createTournamentData = convertFileToDatabase(
            newData,
            {
              name: tournament.name,
              city: tournament.city,
              year: tournament.year,
              lexicon: tournament.lexicon,
              longFormName: tournament.long_form_name,
              dataUrl: tournamentData.data_url, // Use tournamentData.data_url, not tournament.data_url
            },
            tournament.user_id,
          );

          // Use the new updateTournamentData method instead of updateData
          const update: DB.TournamentUpdate =
            await this.repo.updateTournamentData(
              tournament.id,
              tournamentData.data_url,
              newData, // Pass the raw file data, not the converted data
            );

          console.log(
            `Updated tournament ${tournament.id} with new data`,
            JSON.stringify(update.changes, null, 2),
          );

          // Get the full tournament data to transform to domain model
          const fullTournament = await this.repo.getTournamentAsTree(tournament.id, tournament.user_id);
          
          if (!fullTournament) {
            console.error(`Failed to fetch full tournament data for ${tournament.id}`);
            continue;
          }

          // Transform to domain update directly
          const domainTournament = transformToDomainTournament(fullTournament);
          const domainChanges = transformGameChangesToDomain(update.changes);
          
          const transformedUpdate: Domain.TournamentUpdate = {
            tournament: domainTournament,
            changes: domainChanges,
          };
          const gamesAddedMessage: GamesAddedMessage = {
            userId: tournament.user_id,
            tournamentId: tournament.id,
            update: transformedUpdate,
            timestamp: Date.now(),
          };
          this.io.emit("GamesAdded", gamesAddedMessage);
        }
      } catch (error) {
        console.error(`Error polling tournament ${tournament.id}:`, error);
      }
    }
  }

  private async clearExpiredPolls(): Promise<void> {
    await this.repo.endInactivePollable();
  }
}
