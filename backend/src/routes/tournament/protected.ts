import express, { Router, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { Server as SocketIOServer } from "socket.io";

import { TournamentIdParams } from "@shared/types/api";

import { TournamentRepository } from "../../repositories/tournamentRepository";
import { convertFileToDatabase } from "../../services/fileToDatabaseConversions";
import { loadTournamentFile } from "../../services/loadTournamentFile";
import { CrossTablesSyncService } from "../../services/crossTablesSync";
import { CrossTablesHeadToHeadService } from "../../services/crossTablesHeadToHeadService";
import * as DB from "../../types/database";
import * as Api from "../../utils/apiHelpers";

interface TournamentIdParamsDict extends ParamsDictionary, TournamentIdParams {}

export function protectedTournamentRoutes(
  repo: TournamentRepository,
  crossTablesSync: CrossTablesSyncService,
  crossTablesHeadToHeadService: CrossTablesHeadToHeadService,
  io: SocketIOServer
): Router {
  const router = express.Router();

  // Create tournament (automatically assigns to authenticated user)
  const createTournament: RequestHandler<
    {},
    Api.ApiResponse<DB.TournamentRow>,
    DB.TournamentMetadata
  > = Api.withErrorHandling(async (req, res) => {
    const metadata = req.body;
    const userId = req.user!.id;
    // Load file data
    const rawData = await loadTournamentFile(metadata.dataUrl);
    
    // FIRST: Ensure all cross-tables players exist (synchronous)
    console.log('Syncing cross-tables data before tournament creation...');
    try {
      await crossTablesSync.syncPlayersFromTournament(rawData, true); // Include detailed data for tournament creation
      console.log('Cross-tables sync completed successfully');
    } catch (error) {
      console.error('ERROR: Failed to sync cross-tables data:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
      // Continue anyway - some players might not have cross-tables data
      console.log('Continuing with tournament creation despite sync errors...');
    }
    
    // SECOND: Sync head-to-head data for all divisions
    console.log('Syncing head-to-head data for tournament divisions...');
    try {
      for (const [divisionIndex, division] of rawData.divisions.entries()) {
        const playerIds = crossTablesHeadToHeadService.extractPlayerIdsFromFileDivision(division);
        if (playerIds.length > 1) {
          console.log(`Syncing H2H data for division ${division.name} (${playerIds.length} players with XT IDs)...`);
          await crossTablesHeadToHeadService.syncHeadToHeadDataForPlayers(playerIds);
        } else {
          console.log(`Skipping H2H sync for division ${division.name} - insufficient players with XT IDs`);
        }
      }
      console.log('Head-to-head sync completed successfully');
    } catch (error) {
      console.error('ERROR: Failed to sync head-to-head data:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
      // Continue anyway - head-to-head data is supplementary
      console.log('Continuing with tournament creation despite H2H sync errors...');
    }
    
    // Convert to database format
    const createTournamentData = convertFileToDatabase(
      rawData,
      metadata,
      userId,
    );
    
    // Set default polling to 4 days from now
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
    createTournamentData.tournament.poll_until = fourDaysFromNow;
    
    // Create tournament - foreign keys will be valid now
    const tournament = await repo.create(createTournamentData);
    
    // FOURTH: Update tournament player xtids to link with CrossTables data
    try {
      await crossTablesSync.updateTournamentPlayerXtids(tournament.id, rawData);
      console.log(`Tournament player xtids updated successfully for tournament ${tournament.id}`);
    } catch (error) {
      console.error(`ERROR: Failed to update tournament player xtids for tournament ${tournament.id}:`, error);
      // Don't fail tournament creation for this
    }
    
    res.status(201).json(Api.success(tournament));
  });

  const deleteTournament: RequestHandler<TournamentIdParamsDict> =
    Api.withErrorHandling(async (req, res) => {
      const { id } = req.params;
      const userId = req.user!.id;
      const tournamentId = parseInt(id, 10);
      await repo.deleteByIdForUser(tournamentId, userId);
      res.status(204).send(); // No content response for successful deletion
    });

  const updateTournament: RequestHandler<
    TournamentIdParamsDict,
    Api.ApiResponse<DB.TournamentUpdate>,
    DB.TournamentMetadata
  > = Api.withErrorHandling(async (req, res) => {
    const { id } = req.params;
    const metadata = req.body;
    const userId = req.user!.id;
    const tournamentId = parseInt(id, 10);

    // Get existing tournament to check for theme changes
    const existingTournament = await repo.findByIdForUser(tournamentId, userId);
    const oldTheme = existingTournament?.theme;
    const newTheme = metadata.theme;

    await Api.withDataOr404(
      repo.findByIdForUser(tournamentId, userId),
      res,
      "Tournament not found",
      async (existingTournament) => {
        // Get the current tournament data to check if dataUrl changed
        await Api.withDataOr404(
          repo.getTournamentData(tournamentId),
          res,
          "Tournament data not found",
          async (existingTournamentData) => {
            // Check if dataUrl changed - if so, we need to reload and convert the data
            if (metadata.dataUrl !== existingTournamentData.data_url) {
              // Load new data from the URL
              const newData = await loadTournamentFile(metadata.dataUrl);
              
              // FIRST: Ensure all cross-tables players exist (synchronous)
              console.log(`Syncing cross-tables data before updating tournament ${tournamentId}...`);
              try {
                await crossTablesSync.syncPlayersFromTournament(newData, true); // Include detailed data for tournament updates
                console.log(`Cross-tables sync completed successfully for tournament ${tournamentId}`);
              } catch (error) {
                console.error(`ERROR: Failed to sync cross-tables data for tournament ${tournamentId}:`, error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
                // Continue anyway - some players might not have cross-tables data
                console.log('Continuing with tournament update despite sync errors...');
              }
              
              // SECOND: Sync head-to-head data for all divisions
              console.log(`Syncing head-to-head data for tournament ${tournamentId} divisions...`);
              try {
                for (const [divisionIndex, division] of newData.divisions.entries()) {
                  const playerIds = crossTablesHeadToHeadService.extractPlayerIdsFromFileDivision(division);
                  if (playerIds.length > 1) {
                    console.log(`Syncing H2H data for division ${division.name} (${playerIds.length} players with XT IDs)...`);
                    await crossTablesHeadToHeadService.syncHeadToHeadDataForPlayers(playerIds);
                  } else {
                    console.log(`Skipping H2H sync for division ${division.name} - insufficient players with XT IDs`);
                  }
                }
                console.log(`Head-to-head sync completed successfully for tournament ${tournamentId}`);
              } catch (error) {
                console.error(`ERROR: Failed to sync head-to-head data for tournament ${tournamentId}:`, error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
                // Continue anyway - head-to-head data is supplementary
                console.log('Continuing with tournament update despite H2H sync errors...');
              }
              
              // Update everything in one transaction through repo
              const update: DB.TournamentUpdate =
                await repo.updateTournamentWithNewData(
                  tournamentId,
                  userId,
                  metadata,
                  convertFileToDatabase(newData, metadata, userId),
                );
              
              // Update tournament player xtids to link with CrossTables data
              try {
                await crossTablesSync.updateTournamentPlayerXtids(tournamentId, newData);
                console.log(`Tournament player xtids updated successfully for tournament ${tournamentId} after update`);
              } catch (error) {
                console.error(`ERROR: Failed to update tournament player xtids for tournament ${tournamentId}:`, error);
                // Don't fail tournament update for this
              }
              
              // Check for theme changes and broadcast via websocket
              if (oldTheme !== newTheme && newTheme) {
                console.log(`🎨 Tournament ${tournamentId} theme changed from ${oldTheme || 'default'} to ${newTheme}`);
                io.emit('tournament-theme-changed', {
                  tournamentId,
                  theme: newTheme,
                  tournamentName: update.tournament.name,
                  userId
                });
              }
              
              res.json(Api.success(update));
            } else {
              // Just update metadata fields through repo
              const tournament: DB.TournamentRow =
                await repo.updateTournamentMetadata(
                  tournamentId,
                  userId,
                  metadata,
                );
              const update: DB.TournamentUpdate = {
                tournament,
                changes: { added: [], updated: [] },
              };
              
              // Check for theme changes and broadcast via websocket
              if (oldTheme !== newTheme && newTheme) {
                console.log(`🎨 Tournament ${tournamentId} theme changed from ${oldTheme || 'default'} to ${newTheme}`);
                io.emit('tournament-theme-changed', {
                  tournamentId,
                  theme: newTheme,
                  tournamentName: tournament.name,
                  userId
                });
              }
              
              res.json(Api.success(update));
            }
          },
        );
      },
    );
  });

  const getTournamentListForUser: RequestHandler<
    {},
    Api.ApiResponse<DB.TournamentRow[]>
  > = Api.withErrorHandling(async (req, res) => {
    const result = await repo.findAllForUser(req.user!.id);
    res.json(Api.success(result));
  });

  const refetchTournament: RequestHandler<TournamentIdParamsDict> =
    Api.withErrorHandling(async (req, res) => {
      const { id } = req.params;
      const userId = req.user!.id;
      const tournamentId = parseInt(id, 10);

      await Api.withDataOr404(
        repo.findByIdForUser(tournamentId, userId),
        res,
        "Tournament not found",
        async (tournament) => {
          await Api.withDataOr404(
            repo.getTournamentData(tournamentId),
            res,
            "Tournament data not found",
            async (tournamentData) => {
              const rawData = await loadTournamentFile(tournamentData.data_url);
              
              console.log(`Refetching tournament ${tournamentId} with CrossTables data...`);
              
              // FIRST: Sync CrossTables player data
              try {
                await crossTablesSync.syncPlayersFromTournament(rawData, true);
                console.log(`CrossTables sync completed successfully for tournament ${tournamentId}`);
                
                // SECOND: Update tournament player xtids
                await crossTablesSync.updateTournamentPlayerXtids(tournamentId, rawData);
                console.log(`Tournament player xtids updated successfully for tournament ${tournamentId}`);
              } catch (error) {
                console.error(`ERROR: Failed to sync CrossTables data for tournament ${tournamentId}:`, error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
                throw new Error('Failed to sync CrossTables data');
              }
              
              // SECOND: Sync head-to-head data for all divisions
              try {
                for (const [divisionIndex, division] of rawData.divisions.entries()) {
                  const playerIds = crossTablesHeadToHeadService.extractPlayerIdsFromFileDivision(division);
                  if (playerIds.length > 1) {
                    console.log(`Syncing H2H data for division ${division.name} (${playerIds.length} players with XT IDs)...`);
                    await crossTablesHeadToHeadService.syncHeadToHeadDataForPlayers(playerIds);
                  } else {
                    console.log(`Skipping H2H sync for division ${division.name} - insufficient players with XT IDs`);
                  }
                }
                console.log(`Head-to-head sync completed successfully for tournament ${tournamentId}`);
              } catch (error) {
                console.error(`ERROR: Failed to sync head-to-head data for tournament ${tournamentId}:`, error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
                // Don't throw here - H2H data is supplementary
              }
              
              res.json(Api.success({ message: 'Tournament data refetch completed successfully' }));
            }
          );
        }
      );
    });

  const fullRefetchTournament: RequestHandler<TournamentIdParamsDict> =
    Api.withErrorHandling(async (req, res) => {
      const { id } = req.params;
      const userId = req.user!.id;
      const tournamentId = parseInt(id, 10);

      await Api.withDataOr404(
        repo.findByIdForUser(tournamentId, userId),
        res,
        "Tournament not found",
        async (tournament) => {
          await Api.withDataOr404(
            repo.getTournamentData(tournamentId),
            res,
            "Tournament data not found",
            async (tournamentData) => {
              const rawData = await loadTournamentFile(tournamentData.data_url);
              
              console.log(`🧹 Full refetch tournament ${tournamentId} - clearing all CrossTables data...`);
              
              // FIRST: Clear all xtids for this tournament
              console.log(`🧹 Clearing all player xtids for tournament ${tournamentId}...`);
              await repo.clearPlayerXtids(tournamentId);
              
              // SECOND: Sync CrossTables player data from scratch
              try {
                await crossTablesSync.syncPlayersFromTournament(rawData, true);
                console.log(`CrossTables sync completed successfully for tournament ${tournamentId}`);
                
                // THIRD: Update tournament player xtids
                await crossTablesSync.updateTournamentPlayerXtids(tournamentId, rawData);
                console.log(`Tournament player xtids updated successfully for tournament ${tournamentId}`);
              } catch (error) {
                console.error(`ERROR: Failed to sync CrossTables data for tournament ${tournamentId}:`, error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
                throw new Error('Failed to sync CrossTables data');
              }
              
              // FOURTH: Sync head-to-head data for all divisions
              try {
                for (const [divisionIndex, division] of rawData.divisions.entries()) {
                  const playerIds = crossTablesHeadToHeadService.extractPlayerIdsFromFileDivision(division);
                  if (playerIds.length > 1) {
                    console.log(`Syncing H2H data for division ${division.name} (${playerIds.length} players with XT IDs)...`);
                    await crossTablesHeadToHeadService.syncHeadToHeadDataForPlayers(playerIds);
                  } else {
                    console.log(`Skipping H2H sync for division ${division.name} - insufficient players with XT IDs`);
                  }
                }
                console.log(`Head-to-head sync completed successfully for tournament ${tournamentId}`);
              } catch (error) {
                console.error(`ERROR: Failed to sync head-to-head data for tournament ${tournamentId}:`, error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
                // Don't throw here - H2H data is supplementary
              }
              
              res.json(Api.success({ message: 'Tournament full refetch completed successfully' }));
            }
          );
        }
      );
    });

  router.get("/list", getTournamentListForUser);
  router.post("/", createTournament);
  router.put("/:id", updateTournament);
  router.delete("/:id", deleteTournament);
  router.post("/:id/enrich", refetchTournament);
  router.post("/:id/full-refetch", fullRefetchTournament);

  return router;
}
