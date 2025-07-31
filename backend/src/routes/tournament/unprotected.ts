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

  // Shared validation and error handling wrapper
  const withValidation = <T>(
    handler: (params: ParsedParams, req: any, res: Response) => Promise<T>,
  ): RequestHandler => {
    return async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const tournamentId = parseInt(req.params.tournamentId);
        const divisionId = req.params.divisionId
          ? parseInt(req.params.divisionId)
          : undefined;

        if (
          isNaN(userId) ||
          isNaN(tournamentId) ||
          (req.params.divisionId && isNaN(divisionId!))
        ) {
          res.status(400).json(Api.failure("Invalid parameters"));
          return;
        }

        const params = { userId, tournamentId, divisionId };
        await handler(params, req, res);
      } catch (error) {
        console.error("💥 Route error:", error);
        res
          .status(500)
          .json(
            Api.failure(
              error instanceof Error ? error.message : "Unknown error",
            ),
          );
      }
    };
  };

  // Get full tournament data
  const getTournamentForUser = withValidation(
    async ({ userId, tournamentId, divisionId }, req, res) => {
      const tournament =
        await tournamentRepository.getHierarchicalTournamentForUser(
          tournamentId,
          userId,
          divisionId,
        );

      if (!tournament) {
        res
          .status(404)
          .json(
            Api.failure(
              divisionId
                ? "Tournament or division not found"
                : "Tournament not found",
            ),
          );
        return;
      }

      res.json(Api.success(tournament));
    },
  );

  // Get tournament metadata only
  const getTournamentRowForUser = withValidation(
    async ({ userId, tournamentId }, req, res) => {
      const tournamentRow = await tournamentRepository.findByIdForUser(
        tournamentId,
        userId,
      );

      if (!tournamentRow) {
        res.status(404).json(Api.failure("Tournament not found"));
        return;
      }

      res.json(Api.success(tournamentRow));
    },
  );

  // Get divisions for tournament
  const getDivisionsForTournament = withValidation(
    async ({ userId, tournamentId }, req, res) => {
      const divisions = await tournamentRepository.getDivisions(
        tournamentId,
        userId,
      );
      res.json(Api.success(divisions));
    },
  );

  // Get players for division
  const getPlayersForDivision = withValidation(
    async ({ userId, tournamentId }, req, res) => {
      const divisionName = req.params.divisionName;
      if (!divisionName) {
        res.status(400).json(Api.failure("Division name is required"));
        return;
      }

      const players = await tournamentRepository.getPlayersForDivision(
        tournamentId,
        userId,
        divisionName,
      );
      res.json(Api.success(players));
    },
  );

  // Routes
  router.get("/users/:userId/tournaments/:tournamentId", getTournamentForUser);
  router.get(
    "/users/:userId/tournaments/:tournamentId/divisions/:divisionId",
    getTournamentForUser,
  );
  router.get(
    "/users/:userId/tournaments/:tournamentId/row",
    getTournamentRowForUser,
  );
  router.get(
    "/users/:userId/tournaments/:tournamentId/divisions",
    getDivisionsForTournament,
  );
  router.get(
    "/users/:userId/tournaments/:tournamentId/divisions/:divisionName/players",
    getPlayersForDivision,
  );

  return router;
}
