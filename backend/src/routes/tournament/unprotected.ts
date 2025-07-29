import express, { Router, Response, RequestHandler } from "express";
import { TournamentRepository } from "../../repositories/tournamentRepository";
import * as DB from "@shared/types/database";
import * as Api from "@shared/types/apiTypes";

interface UserTournamentParams {
  userId: string;
  tournamentId: string;
  divisionId?: string; // Now optional
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

  // Get tournament data for user (optionally filtered to specific division)
  const getTournamentForUser: RequestHandler<
    UserTournamentParams,
    Api.ApiResponse<DB.Tournament>
  > = async (req, res) => {
    console.log("🔍 getTournamentForUser called:", req.params);

    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        console.log("❌ Invalid user ID");
        res.status(400).json(Api.failure("Invalid user ID"));
        return;
      }

      const tournamentId = parseInt(req.params.tournamentId, 10);
      if (isNaN(tournamentId)) {
        console.log("❌ Invalid tournament ID");
        res.status(400).json(Api.failure("Invalid tournament ID"));
        return;
      }

      // Division ID is optional - if provided, validate it
      let divisionId: number | undefined = undefined;
      if (req.params.divisionId) {
        divisionId = parseInt(req.params.divisionId, 10);
        if (isNaN(divisionId)) {
          console.log("❌ Invalid division ID");
          res.status(400).json(Api.failure("Invalid division ID"));
          return;
        }
      }

      const logContext = divisionId !== undefined
        ? `division ${divisionId} in tournament ${tournamentId}`
        : `complete tournament ${tournamentId}`;

      console.log(`🔄 Looking for ${logContext} for user ${userId}`);

      // Get hierarchical tournament data (with optional division filter)
      const tournament = await tournamentRepository.getHierarchicalTournamentForUser(tournamentId, userId, divisionId);

      console.log("📊 Tournament query result:", tournament ? "found" : "not found");
      if (tournament) {
        console.log("📊 Tournament data:", {
          divisions: tournament.divisions.length,
          totalPlayers: tournament.divisions.reduce((sum, d) => sum + d.players.length, 0),
          totalGames: tournament.divisions.reduce((sum, d) => sum + d.games.length, 0)
        });
      }

      if (tournament === null) {
        const errorMsg = divisionId !== undefined
          ? "Tournament or division not found"
          : "Tournament not found";
        console.log(`❌ ${errorMsg}`);
        res.status(404).json(Api.failure(errorMsg));
        return;
      }

      res.json(Api.success(tournament));
    } catch (error) {
      console.error("💥 Error in getTournamentForUser:", error);
      res.status(500).json(Api.failure(error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Single route that handles both cases
  // /users/:userId/tournaments/:tournamentId - gets complete tournament
  // /users/:userId/tournaments/:tournamentId/divisions/:divisionId - gets filtered tournament
  router.get("/users/:userId/tournaments/:tournamentId", getTournamentForUser);
  router.get("/users/:userId/tournaments/:tournamentId/divisions/:divisionId", getTournamentForUser);

  return router;
}