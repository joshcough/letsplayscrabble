import express, { Router, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { TournamentRepository } from "../../repositories/tournamentRepository";
import { loadTournamentFile } from "../../services/loadTournamentFile";
import { convertFileToDatabase } from "../../services/fileToDatabaseConversions";
import * as DB from "@shared/types/database";
import * as Api from "@shared/types/apiTypes";

// Request types
interface CreateTournamentBody {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}

interface TournamentIdParams extends ParamsDictionary {
  id: string;
}

interface UpdateTournamentBody {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}

export function protectedTournamentRoutes(
  tournamentRepository: TournamentRepository,
): Router {
  const router = express.Router();

  // Create tournament (automatically assigns to authenticated user)
  const createTournament: RequestHandler<
    {},
    any,
    CreateTournamentBody
  > = async (req, res) => {
    const { name, city, year, lexicon, longFormName, dataUrl } = req.body;

    try {
      const userId = req.user!.id;

      // Load file data
      const rawData = await loadTournamentFile(dataUrl);

      // Convert to database format
      const createTournamentData = convertFileToDatabase(rawData, {
        name,
        city,
        year,
        lexicon,
        longFormName,
        dataUrl,
        userId,
      });

      // Create tournament using clean repository
      const tournament =
        await tournamentRepository.create(createTournamentData);

      res.status(201).json(tournament);
    } catch (error) {
      console.error("Database error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const deleteTournament: RequestHandler<TournamentIdParams> = async (
    req,
    res,
  ) => {
    const { id } = req.params;

    try {
      const userId = req.user!.id;
      const tournamentId = parseInt(id, 10);

      await tournamentRepository.deleteByIdForUser(tournamentId, userId);
      res.status(204).send(); // No content response for successful deletion
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const updateTournament: RequestHandler<
    TournamentIdParams,
    Api.ApiResponse<DB.TournamentRow>,
    UpdateTournamentBody
  > = async (req, res) => {
    const { id } = req.params;
    const { name, city, year, lexicon, longFormName, dataUrl } = req.body;

    try {
      const userId = req.user!.id;
      const tournamentId = parseInt(id, 10);

      const existingTournament = await tournamentRepository.findByIdForUser(
        tournamentId,
        userId,
      );

      if (!existingTournament) {
        res.status(404).json(Api.failure("Tournament not found"));
        return;
      }

      const metadata = { name, city, year, lexicon, longFormName, dataUrl };

      // Check if dataUrl changed - if so, we need to reload and convert the data
      if (dataUrl !== existingTournament.data_url) {
        // Load new data from the URL
        const newData = await loadTournamentFile(dataUrl);

        // Convert to database format
        const createTournamentData = convertFileToDatabase(newData, {
          name,
          city,
          year,
          lexicon,
          longFormName,
          dataUrl,
          userId,
        });

        // Update everything in one transaction through repo
        const tournament =
          await tournamentRepository.updateTournamentWithNewData(
            tournamentId,
            userId,
            metadata,
            createTournamentData,
          );

        res.json(Api.success(tournament));
      } else {
        // Just update metadata fields through repo
        const tournament = await tournamentRepository.updateTournamentMetadata(
          tournamentId,
          userId,
          metadata,
        );

        res.json(Api.success(tournament));
      }
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(400)
        .json(
          Api.failure(error instanceof Error ? error.message : "Unknown error"),
        );
    }
  };

  const getTournamentListForUser: RequestHandler<
    {},
    Api.ApiResponse<DB.TournamentRow[]>
  > = async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = await tournamentRepository.findAllForUser(userId);
      res.json(Api.success(result));
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json(
          Api.failure(error instanceof Error ? error.message : "Unknown error"),
        );
    }
  };

  router.get("/list", getTournamentListForUser);
  router.post("/", createTournament);
  router.put("/:id", updateTournament);
  router.delete("/:id", deleteTournament);

  return router;
}
