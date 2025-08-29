import * as Domain from "@shared/types/domain";
import { GamesAddedMessage } from "@shared/types/websocket";
import cron, { ScheduledTask } from "node-cron";
import { Server as SocketIOServer } from "socket.io";

import { TournamentRepository } from "../repositories/tournamentRepository";
import * as DB from "../types/database";
import {
  transformGameChangesToDomain,
  transformTournamentRowToSummary,
} from "../utils/domainTransforms";
import { convertFileToDatabase } from "./fileToDatabaseConversions";
import { loadTournamentFile } from "./loadTournamentFile";
import { CrossTablesSyncService } from "./crossTablesSync";

export class TournamentPollingService {
  private isRunning: boolean;
  private job: ScheduledTask | null;

  constructor(
    private readonly repo: TournamentRepository,
    private readonly crossTablesSync: CrossTablesSyncService,
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

        // Simple string comparison - if the data changed, update it
        if (JSON.stringify(newData) !== JSON.stringify(tournamentData.data)) {
          console.log(`Found new data for ${tournament.id}:${tournament.name}`);

          // Only sync cross-tables if this looks like a new tournament load (not just score updates)
          const hasExistingData = tournamentData.data && tournamentData.data.divisions && tournamentData.data.divisions.length > 0;
          if (!hasExistingData) {
            console.log(`Syncing cross-tables data for polled tournament ${tournament.id}... (initial tournament setup)`);
            try {
              await this.crossTablesSync.syncPlayersFromTournament(newData, true);
              console.log(`Cross-tables sync completed successfully for polled tournament ${tournament.id}`);
            } catch (error) {
              console.error(`ERROR: Failed to sync cross-tables data for polled tournament ${tournament.id}:`, error);
              console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
              // Continue anyway - polling shouldn't fail due to cross-tables issues
              console.log('Continuing with tournament update despite sync errors...');
            }
          } else {
            console.log(`Skipping cross-tables sync for polled tournament ${tournament.id} (score update only)`);
          }

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

          const gamesAddedMessage: GamesAddedMessage = {
            userId: tournament.user_id,
            tournamentId: tournament.id,
            update: {
              tournament: transformTournamentRowToSummary(tournament),
              changes: transformGameChangesToDomain(update.changes),
            },
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
