import express, { Router, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";

import { TournamentIdParams } from "@shared/types/api";

import { TournamentRepository } from "../../repositories/tournamentRepository";
import { convertFileToDatabase } from "../../services/fileToDatabaseConversions";
import { loadTournamentFile } from "../../services/loadTournamentFile";
import { CrossTablesSyncService } from "../../services/crossTablesSync";
import * as DB from "../../types/database";
import * as Api from "../../utils/apiHelpers";

interface TournamentIdParamsDict extends ParamsDictionary, TournamentIdParams {}

export function protectedTournamentRoutes(
  repo: TournamentRepository,
  crossTablesSync: CrossTablesSyncService
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
    
    // Convert to database format
    const createTournamentData = convertFileToDatabase(
      rawData,
      metadata,
      userId,
    );
    
    // Create tournament - foreign keys will be valid now
    const tournament = await repo.create(createTournamentData);
    
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
              
              // Update everything in one transaction through repo
              const update: DB.TournamentUpdate =
                await repo.updateTournamentWithNewData(
                  tournamentId,
                  userId,
                  metadata,
                  convertFileToDatabase(newData, metadata, userId),
                );
              
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

  router.get("/list", getTournamentListForUser);
  router.post("/", createTournament);
  router.put("/:id", updateTournament);
  router.delete("/:id", deleteTournament);

  return router;
}
