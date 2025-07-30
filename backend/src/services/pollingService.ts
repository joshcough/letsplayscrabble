import cron, { ScheduledTask } from "node-cron";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { loadTournamentFile } from "./loadTournamentFile";
import { Server as SocketIOServer } from "socket.io";
import { GamesAddedMessage } from "@shared/types/websocket";
import { convertFileToDatabase } from "./fileToDatabaseConversions";

export class TournamentPollingService {
  private isRunning: boolean;
  private job: ScheduledTask | null;

  constructor(
    private readonly tournamentRepo: TournamentRepository,
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
    const activeTournaments = await this.tournamentRepo.findActivePollable();

    for (const tournament of activeTournaments) {
      try {
        const newData = await loadTournamentFile(tournament.data_url);

        // Use a deep comparison of the data
        if (JSON.stringify(newData) !== JSON.stringify(tournament.data)) {
          // Convert file data to database format
          const createTournamentData = convertFileToDatabase(newData, {
            name: tournament.name,
            city: tournament.city,
            year: tournament.year,
            lexicon: tournament.lexicon,
            longFormName: tournament.long_form_name,
            dataUrl: tournament.data_url,
            userId: tournament.user_id,
          });

          await this.tournamentRepo.updateData(
            tournament.id,
            createTournamentData,
          );
          console.log(`Updated tournament ${tournament.id} with new data`);
          this.io.emit("GamesAdded", {
            userId: tournament.user_id,
            tournamentId: tournament.id,
          } as GamesAddedMessage);
        }
      } catch (error) {
        console.error(`Error polling tournament ${tournament.id}:`, error);
      }
    }
  }

  private async clearExpiredPolls(): Promise<void> {
    await this.tournamentRepo.endInactivePollable();
  }
}
