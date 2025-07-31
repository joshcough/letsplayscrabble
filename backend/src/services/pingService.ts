import cron, { ScheduledTask } from "node-cron";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { loadTournamentFile } from "./loadTournamentFile";
import { Server as SocketIOServer } from "socket.io";
import { Ping } from "@shared/types/websocket";
import { convertFileToDatabase } from "./fileToDatabaseConversions";

export class PingService {
  private isRunning: boolean;
  private job: ScheduledTask | null;
  private count: number;

  constructor(
    private readonly io: SocketIOServer,
  ) {
    this.isRunning = false;
    this.job = null;
    this.count = 0;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    // Run every 30 seconds
    this.job = cron.schedule("*/30 * * * * *", async () => {
      try {
        const pingData: Ping = {
          timestamp: Date.now(),
          messageId: this.count++,
        };

        console.log("Sending ping", pingData);
        this.io.emit("Ping", pingData);
      } catch (error) {
        console.error("Error in ping service:", error);
      }
    });

    this.isRunning = true;
    console.log("Ping service started");
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log("Ping service stopped");
    }
  }
}
