import express, { Router, Response, RequestHandler } from "express";

import { TournamentRepository } from "../../repositories/tournamentRepository";
import * as DB from "../../types/database";
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
  repo: TournamentRepository,
): Router {
  const router = express.Router();

  // Shared validation and error handling wrapper
  const withInputValidation = <T>(
    handler: (params: ParsedParams, req: any, res: Response) => Promise<T>,
  ): RequestHandler => {
    return async (req, res) => {
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
    };
  };

  // Get full tournament data (OLD - returns flat structure)
  const getTournamentForUser = withInputValidation(
    async ({ userId, tournamentId, divisionId }, req, res) => {
      await Api.withDataOr404(
        repo.getTournamentAsTree(tournamentId, userId, divisionId),
        res,
        "Tournament or division not found",
        async (tournament) => {
          res.json(Api.success(tournament));
        },
      );
    },
  );

  // Get full tournament data (V2 - returns domain model)
  const getTournamentForUserV2 = withInputValidation(
    async ({ userId, tournamentId, divisionId }, req, res) => {
      await Api.withDataOr404(
        repo.getTournamentAsDomainModel(tournamentId, userId, divisionId),
        res,
        "Tournament or division not found",
        async (tournament) => {
          res.json(Api.success(tournament));
        },
      );
    },
  );

  // Get tournament metadata only
  const getTournamentRowForUser = withInputValidation(
    async ({ userId, tournamentId }, req, res) => {
      await Api.withDataOr404(
        repo.findByIdForUser(tournamentId, userId),
        res,
        "Tournament not found",
        async (tournamentRow) => {
          res.json(Api.success(tournamentRow));
        },
      );
    },
  );

  // Get divisions for tournament
  const getDivisionsForTournament = withInputValidation(
    async ({ userId, tournamentId }, req, res) => {
      const divisions = await repo.getDivisions(tournamentId, userId);
      res.json(Api.success(divisions));
    },
  );

  // Get players for division
  const getPlayersForDivision = withInputValidation(
    async ({ userId, tournamentId }, req, res) => {
      const divisionName = req.params.divisionName;
      if (!divisionName) {
        res.status(400).json(Api.failure("Division name is required"));
        return;
      }
      const players = await repo.getPlayersForDivision(
        tournamentId,
        userId,
        divisionName,
      );
      res.json(Api.success(players));
    },
  );

  // OLD Routes (for backward compatibility)
  router.get("/users/:userId/tournaments/:tournamentId", getTournamentForUser);
  router.get(
    "/users/:userId/tournaments/:tournamentId/divisions/:divisionId",
    getTournamentForUser,
  );

  // V2 Routes (return domain model)
  router.get(
    "/v2/users/:userId/tournaments/:tournamentId",
    getTournamentForUserV2,
  );
  router.get(
    "/v2/users/:userId/tournaments/:tournamentId/divisions/:divisionId",
    getTournamentForUserV2,
  );

  // Other routes (unchanged for now)
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
