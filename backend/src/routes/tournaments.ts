import express, { Router, Request, Response } from "express";
import { ParamsDictionary, RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CleanTournamentRepository } from "../repositories/cleanTournamentRepository";
import { loadTournamentFile } from "../services/dataProcessing";
import { convertFileToDatabase } from "@shared/utils/conversions";

// Request types
interface CreateTournamentBody {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}

interface EnablePollingBody {
  days: number;
}

interface TournamentIdParams extends ParamsDictionary {
  id: string;
}

interface TournamentNameParams extends ParamsDictionary {
  name: string;
}

interface UserTournamentParams extends ParamsDictionary {
  userId: string;
  id: string;
}

interface UserTournamentNameParams extends ParamsDictionary {
  userId: string;
  name: string;
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
  cleanTournamentRepository: CleanTournamentRepository
): Router {
  const router = express.Router();

  // Get all tournaments for authenticated user
  const getAllTournaments: RequestHandler = async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = await tournamentRepository.findAllForUser(userId);
      res.json(result);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Get tournament by ID (user-scoped)
  const getTournamentById: RequestHandler<TournamentIdParams> = async (
    req,
    res,
  ) => {
    try {
      const userId = req.user!.id;
      const t = await tournamentRepository.findByIdForUser(
        parseInt(req.params.id, 10),
        userId
      );
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

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
      const tournament = await cleanTournamentRepository.create(createTournamentData);

      res.status(201).json(tournament);
    } catch (error) {
      console.error("Database error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const deleteTournament: RequestHandler<TournamentIdParams> = async (req, res) => {
    const { id } = req.params;

    try {
      const userId = req.user!.id;
      // First verify user owns this tournament
      const existingTournament = await tournamentRepository.findByIdForUser(
        parseInt(id, 10),
        userId
      );

      if (!existingTournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }

      await tournamentRepository.deleteByIdForUser(parseInt(id, 10), userId);
      res.status(204).send(); // No content response for successful deletion
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Start or update polling for a tournament (user must own the tournament)
  const startPolling: RequestHandler<
    TournamentIdParams,
    any,
    EnablePollingBody
  > = async (req, res) => {
    const { id } = req.params;
    const { days } = req.body;

    try {
      const userId = req.user!.id;
      // First verify user owns this tournament
      const tournament = await tournamentRepository.findByIdForUser(
        parseInt(id, 10),
        userId
      );

      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }

      const pollUntil = new Date();
      pollUntil.setDate(pollUntil.getDate() + days);
      await tournamentRepository.updatePollUntil(parseInt(id, 10), pollUntil);
      res.json({ message: "Polling enabled", pollUntil });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Stop polling for a tournament (user must own the tournament)
  const stopPolling: RequestHandler<TournamentIdParams> = async (req, res) => {
    const { id } = req.params;

    try {
      const userId = req.user!.id;
      // First verify user owns this tournament
      const tournament = await tournamentRepository.findByIdForUser(
        parseInt(id, 10),
        userId
      );

      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }

      await tournamentRepository.stopPolling(parseInt(id, 10));
      res.json({ message: "Polling disabled" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const updateTournament: RequestHandler<
    TournamentIdParams,
    any,
    UpdateTournamentBody
  > = async (req, res) => {
    const { id } = req.params;
    const { name, city, year, lexicon, longFormName, dataUrl } = req.body;

    try {
      const userId = req.user!.id;
      const tournamentId = parseInt(id, 10);

      // Get existing tournament through repo (no direct DB access!)
      const existingTournament = await cleanTournamentRepository.findByIdForUser(
        tournamentId,
        userId
      );

      if (!existingTournament) {
        res.status(404).json({ message: "Tournament not found" });
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
        const tournament = await cleanTournamentRepository.updateTournamentWithNewData(
          tournamentId,
          userId,
          metadata,
          createTournamentData
        );

        res.json(tournament);
      } else {
        // Just update metadata fields through repo
        const tournament = await cleanTournamentRepository.updateTournamentMetadata(
          tournamentId,
          userId,
          metadata
        );

        res.json(tournament);
      }
    } catch (error) {
      console.error("Database error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  router.get("/", getAllTournaments);
  router.get("/:id", getTournamentById);
  router.post("/", createTournament);
  router.post("/:id/polling", startPolling);
  router.delete("/:id/polling", stopPolling);
  router.put("/:id", updateTournament);
  router.delete("/:id", deleteTournament);

  return router;
}

export function unprotectedTournamentRoutes(
  tournamentRepository: TournamentRepository,
): Router {
  const router = express.Router();

  // Helper to get userId from params and validate it
  const getUserIdFromParams = (req: any): number | null => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return null;
    }
    return userId;
  };

  // Get all tournaments for specific user (public access)
  const getAllTournamentsForUser: RequestHandler<{ userId: string }> = async (req, res) => {
    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      const result = await tournamentRepository.findAllForUser(userId);
      res.json(result);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Get tournament by ID for specific user (public access)
  const getTournamentByIdForUser: RequestHandler<UserTournamentParams> = async (
    req,
    res,
  ) => {
    console.log("🔍 getTournamentByIdForUser called:", req.params);

    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        console.log("❌ Invalid user ID");
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      console.log("🔄 Looking for tournament", req.params.id, "for user", userId);

      const t = await tournamentRepository.findByIdForUser(
        parseInt(req.params.id, 10),
        userId
      );

      console.log("📊 Tournament query result:", t ? "found" : "not found");

      if (t === null) {
        console.log("❌ Tournament not found");
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("💥 Error in getTournamentByIdForUser:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Get tournament by name for specific user (public access)
  const getTournamentByNameForUser: RequestHandler<UserTournamentNameParams> = async (
    req,
    res,
  ) => {
    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      const t = await tournamentRepository.findByNameForUser(req.params.name, userId);
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Global methods (all users) - keep for backwards compatibility
  const getAllTournaments: RequestHandler = async (_req, res) => {
    try {
      const result = await tournamentRepository.findAll();
      res.json(result);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getTournamentById: RequestHandler<TournamentIdParams> = async (
    req,
    res,
  ) => {
    try {
      const t = await tournamentRepository.findById(
        parseInt(req.params.id, 10),
      );
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getTournamentByName: RequestHandler<TournamentNameParams> = async (
    req,
    res,
  ) => {
    try {
      const t = await tournamentRepository.findByName(req.params.name);
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  interface DivisionStatsParams {
    tournamentId: string;
    divisionId: string;
  }

  interface UserDivisionStatsParams {
    userId: string;
    tournamentId: string;
    divisionId: string;
  }

  const getDivisionStats: RequestHandler<DivisionStatsParams> = async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const divisionId = parseInt(req.params.divisionId);

      if (isNaN(tournamentId) || isNaN(divisionId)) {
        res.status(400).json({ error: 'Invalid tournament or division ID' });
        return;
      }

      const stats = await tournamentRepository.getDivisionStats(tournamentId, divisionId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching division stats:', error);
      res.status(500).json({ error: 'Failed to fetch division stats' });
    }
  };

  const getTournamentStats: RequestHandler<DivisionStatsParams> = async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);

      if (isNaN(tournamentId)) {
        res.status(400).json({ error: 'Invalid tournament ID' });
        return;
      }

      const stats = await tournamentRepository.getTournamentStats(tournamentId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
      res.status(500).json({ error: 'Failed to fetch tournament stats' });
    }
  };

  const getDivisionStatsForUser: RequestHandler<UserDivisionStatsParams> = async (req, res) => {
    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      const tournamentId = parseInt(req.params.tournamentId);
      const divisionId = parseInt(req.params.divisionId);

      if (isNaN(tournamentId) || isNaN(divisionId)) {
        res.status(400).json({ error: 'Invalid tournament or division ID' });
        return;
      }

      // Verify user has access to this tournament
      const tournament = await tournamentRepository.findByIdForUser(tournamentId, userId);
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }

      const stats = await tournamentRepository.getDivisionStats(tournamentId, divisionId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching division stats:', error);
      res.status(500).json({ error: 'Failed to fetch division stats' });
    }
  };

  const getTournamentStatsForUser: RequestHandler<UserDivisionStatsParams> = async (req, res) => {
    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      const tournamentId = parseInt(req.params.tournamentId);

      if (isNaN(tournamentId)) {
        res.status(400).json({ error: 'Invalid tournament ID' });
        return;
      }

      // Verify user has access to this tournament
      const tournament = await tournamentRepository.findByIdForUser(tournamentId, userId);
      if (!tournament) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }

      const stats = await tournamentRepository.getTournamentStats(tournamentId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
      res.status(500).json({ error: 'Failed to fetch tournament stats' });
    }
  };

  // User-scoped routes (for overlays)
  router.get("/users/:userId", getAllTournamentsForUser);
  router.get("/users/:userId/tournaments/:id", getTournamentByIdForUser);
  router.get("/users/:userId/tournaments/by-name/:name", getTournamentByNameForUser);
  router.get('/users/:userId/tournaments/:tournamentId/divisions/:divisionId/stats', getDivisionStatsForUser);
  router.get('/users/:userId/tournaments/:tournamentId/stats', getTournamentStatsForUser);

  // Global routes (backwards compatibility)
  router.get("/", getAllTournaments);
  router.get("/:id", getTournamentById);
  router.get("/by-name/:name", getTournamentByName);
  router.get('/:tournamentId/divisions/:divisionId/stats', getDivisionStats);
  router.get('/:tournamentId/stats', getTournamentStats);

  return router;
}