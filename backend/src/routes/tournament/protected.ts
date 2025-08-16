import express, { Router, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";

import * as DB from "../../types/database";

import { TournamentRepository } from "../../repositories/tournamentRepository";
import { convertFileToDatabase } from "../../services/fileToDatabaseConversions";
import { loadTournamentFile } from "../../services/loadTournamentFile";
import * as Api from "../../utils/apiHelpers";

interface TournamentIdParams extends ParamsDictionary {
  id: string;
}

export function protectedTournamentRoutes(repo: TournamentRepository): Router {
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
    // Convert to database format
    const createTournamentData = convertFileToDatabase(
      rawData,
      metadata,
      userId,
    );
    // Create tournament using clean repository
    const tournament = await repo.create(createTournamentData);
    res.status(201).json(Api.success(tournament));
  });

  const deleteTournament: RequestHandler<TournamentIdParams> =
    Api.withErrorHandling(async (req, res) => {
      const { id } = req.params;
      const userId = req.user!.id;
      const tournamentId = parseInt(id, 10);
      await repo.deleteByIdForUser(tournamentId, userId);
      res.status(204).send(); // No content response for successful deletion
    });

  const updateTournament: RequestHandler<
    TournamentIdParams,
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
        const existingTournamentData =
          await repo.getTournamentData(tournamentId);

        if (!existingTournamentData) {
          res.status(404).json(Api.failure("Tournament data not found"));
          return;
        }

        // Check if dataUrl changed - if so, we need to reload and convert the data
        if (metadata.dataUrl !== existingTournamentData.data_url) {
          // Load new data from the URL
          const newData = await loadTournamentFile(metadata.dataUrl);
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
            await repo.updateTournamentMetadata(tournamentId, userId, metadata);
          const update: DB.TournamentUpdate = {
            tournament,
            changes: { added: [], updated: [] },
          };
          res.json(Api.success(update));
        }
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
