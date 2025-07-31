import express, { Router, Response, RequestHandler } from "express";
import { TournamentRepository } from "../../repositories/tournamentRepository";
import * as DB from "@shared/types/database";
import * as Api from "../../utils/apiHelpers";

interface UserTournamentParams {
  userId: string;
  tournamentId: string;
  divisionId?: string;
}

interface ParsedParams {
  userId: number;
  tournamentId: number;
  divisionId?: number;
}

export function unprotectedTournamentRoutes(
  tournamentRepository: TournamentRepository,
): Router {
  const router = express.Router();

  // Shared validation logic
  const parseAndValidateParams = (
    req: any,
  ):
    | { success: true; params: ParsedParams }
    | { success: false; error: string } => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return { success: false, error: "Invalid user ID" };
    }

    const tournamentId = parseInt(req.params.tournamentId);
    if (isNaN(tournamentId)) {
      return { success: false, error: "Invalid tournament ID" };
    }

    let divisionId: number | undefined = undefined;
    if (req.params.divisionId) {
      divisionId = parseInt(req.params.divisionId);
      if (isNaN(divisionId)) {
        return { success: false, error: "Invalid division ID" };
      }
    }

    return {
      success: true,
      params: { userId, tournamentId, divisionId },
    };
  };

  // Get full tournament data for user (optionally filtered to specific division)
  const getTournamentForUser: RequestHandler<
    UserTournamentParams,
    Api.ApiResponse<DB.Tournament>
  > = async (req, res) => {
    console.log("🔍 getTournamentForUser called:", req.params);

    try {
      const validation = parseAndValidateParams(req);
      if (!validation.success) {
        console.log("❌", validation.error);
        res.status(400).json(Api.failure(validation.error));
        return;
      }

      const { userId, tournamentId, divisionId } = validation.params;

      const logContext =
        divisionId !== undefined
          ? `division ${divisionId} in tournament ${tournamentId}`
          : `complete tournament ${tournamentId}`;

      console.log(`🔄 Looking for ${logContext} for user ${userId}`);

      // Get hierarchical tournament data (with optional division filter)
      const tournament =
        await tournamentRepository.getHierarchicalTournamentForUser(
          tournamentId,
          userId,
          divisionId,
        );

      console.log(
        "📊 Tournament query result:",
        tournament ? "found" : "not found",
      );
      if (tournament) {
        console.log("📊 Tournament data:", {
          divisions: tournament.divisions.length,
          totalPlayers: tournament.divisions.reduce(
            (sum, d) => sum + d.players.length,
            0,
          ),
          totalGames: tournament.divisions.reduce(
            (sum, d) => sum + d.games.length,
            0,
          ),
        });
      }

      if (tournament === null) {
        const errorMsg =
          divisionId !== undefined
            ? "Tournament or division not found"
            : "Tournament not found";
        console.log(`❌ ${errorMsg}`);
        res.status(404).json(Api.failure(errorMsg));
        return;
      }

      res.json(Api.success(tournament));
    } catch (error) {
      console.error("💥 Error in getTournamentForUser:", error);
      res
        .status(500)
        .json(
          Api.failure(error instanceof Error ? error.message : "Unknown error"),
        );
    }
  };

  // Get just the tournament row data (metadata only)
  const getTournamentRowForUser: RequestHandler<
    UserTournamentParams,
    Api.ApiResponse<DB.TournamentRow>
  > = async (req, res) => {
    console.log("🔍 getTournamentRowForUser called:", req.params);

    try {
      const validation = parseAndValidateParams(req);
      if (!validation.success) {
        console.log("❌", validation.error);
        res.status(400).json(Api.failure(validation.error));
        return;
      }

      const { userId, tournamentId } = validation.params;

      console.log(
        `🔄 Looking for tournament row ${tournamentId} for user ${userId}`,
      );

      // Get just the tournament metadata
      const tournamentRow = await tournamentRepository.findByIdForUser(
        tournamentId,
        userId,
      );

      console.log(
        "📊 Tournament row query result:",
        tournamentRow ? "found" : "not found",
      );

      if (tournamentRow === null) {
        console.log("❌ Tournament not found");
        res.status(404).json(Api.failure("Tournament not found"));
        return;
      }

      res.json(Api.success(tournamentRow));
    } catch (error) {
      console.error("💥 Error in getTournamentRowForUser:", error);
      res
        .status(500)
        .json(
          Api.failure(error instanceof Error ? error.message : "Unknown error"),
        );
    }
  };

  // Routes
  // /users/:userId/tournaments/:tournamentId - gets complete tournament
  // /users/:userId/tournaments/:tournamentId/divisions/:divisionId - gets filtered tournament
  router.get("/users/:userId/tournaments/:tournamentId", getTournamentForUser);
  router.get(
    "/users/:userId/tournaments/:tournamentId/divisions/:divisionId",
    getTournamentForUser,
  );

  // /users/:userId/tournaments/:tournamentId/row - gets just tournament metadata
  router.get(
    "/users/:userId/tournaments/:tournamentId/row",
    getTournamentRowForUser,
  );

  return router;
}
