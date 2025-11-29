import * as Domain from "@shared/types/domain";
import { GamesAddedMessage } from "@shared/types/websocket";
import cron, { ScheduledTask } from "node-cron";
import { Server as SocketIOServer } from "socket.io";
import crypto from "crypto";

import { TournamentRepository } from "../repositories/tournamentRepository";
import * as DB from "../types/database";
import {
  transformGameChangesToDomain,
  transformTournamentRowToSummary,
} from "../utils/domainTransforms";
import { convertFileToDatabase } from "./fileToDatabaseConversions";
import { loadTournamentFile } from "./loadTournamentFile";
import { CrossTablesSyncService } from "./crossTablesSync";
import { crossTablesSync } from "./crossTablesSync";

/**
 * Calculate SHA-256 hash of tournament data
 */
function calculateDataHash(data: any): string {
  const jsonString = JSON.stringify(data);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

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
    console.log("Tournament polling service started (10 second interval)");
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log("Tournament polling service stopped");
    }
  }

  private async pollActiveTournaments(): Promise<void> {
    await this.clearExpiredPolls();

    const activeTournaments = await this.repo.findActivePollableWithData();

    if (activeTournaments.length === 0) {
      return; // Nothing to poll, stay quiet
    }
    for (const { tournament, tournamentData } of activeTournaments) {
      try {
        const newData = await loadTournamentFile(tournamentData.data_url, true);

        // Hash-based comparison - much more reliable than JSON.stringify
        const oldHash = calculateDataHash(tournamentData.data);
        const newHash = calculateDataHash(newData);

        if (newHash !== oldHash) {
          console.log(`Found new data for ${tournament.id}:${tournament.name} (hash changed: ${oldHash.substring(0, 8)}... → ${newHash.substring(0, 8)}...)`);

          // Only sync cross-tables if this looks like a new tournament load (not just score updates)
          const hasExistingData = tournamentData.data && tournamentData.data.divisions && tournamentData.data.divisions.length > 0;
          if (!hasExistingData) {
            console.log(`Syncing cross-tables data for polled tournament ${tournament.id}... (initial tournament setup)`);
            try {
              const divisionXtids = await this.crossTablesSync.syncPlayersFromTournament(newData, true);
              const totalXtids = Array.from(divisionXtids.values()).flat().length;
              console.log(`Cross-tables sync completed successfully for polled tournament ${tournament.id} - discovered ${totalXtids} xtids across ${divisionXtids.size} divisions`);
            } catch (error) {
              console.error(`ERROR: Failed to sync cross-tables data for polled tournament ${tournament.id}:`, error);
              console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
              // Continue anyway - polling shouldn't fail due to cross-tables issues
              console.log('Continuing with tournament update despite sync errors...');
            }
          } else {
            console.log(`Skipping cross-tables sync for polled tournament ${tournament.id} (score update only)`);
          }

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
        } else {
          // No game data changes, but check if there are new players in the file
          const newPlayers = await this.repo.findNewPlayersInFile(tournament.id, newData);
          if (newPlayers.length > 0) {
            console.log(`🆕 Found ${newPlayers.length} new players in file for tournament ${tournament.id} - syncing with CrossTables`);
            
            // Extract cross-tables IDs from new players in the file data for targeted sync
            const newPlayerXtids: number[] = [];
            for (const newPlayer of newPlayers) {
              const division = newData.divisions.find(d => d.name === newPlayer.divisionName);
              const filePlayer = division?.players?.find((p) => p && p.id === newPlayer.seed);
              const xtid = filePlayer?.etc?.xtid;
              // Handle xtid being a number, array, or null/undefined
              if (typeof xtid === 'number') {
                newPlayerXtids.push(xtid);
              } else if (Array.isArray(xtid) && xtid.length > 0) {
                newPlayerXtids.push(xtid[0]); // Use first xtid if array
              }
            }

            if (newPlayerXtids.length > 0) {
              await crossTablesSync.syncSpecificPlayers(newPlayerXtids);
              console.log(`🎯 CrossTables sync processed ${newPlayerXtids.length} xtids for new players`);
            } else {
              console.log(`🔍 No cross-tables IDs found for new players`);
            }
            
            // Need to add these new players to the database with proper tournament conversion
            // This is more complex - we need to convert the file data and run incremental update
            const createTournamentData = await convertFileToDatabase(
              newData,
              {
                name: tournament.name,
                city: tournament.city,
                year: tournament.year,
                lexicon: tournament.lexicon,
                longFormName: tournament.long_form_name,
                dataUrl: tournamentData.data_url,
              },
              tournament.user_id,
            );

            const update: DB.TournamentUpdate = await this.repo.updateTournamentData(
              tournament.id,
              tournamentData.data_url,
              newData,
            );

            console.log(`✅ Added ${newPlayers.length} new players to tournament ${tournament.id}`);
            
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
          // No log when there's nothing to do - stay quiet
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
