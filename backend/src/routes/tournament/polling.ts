import express, { Router, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";

import { TournamentRepository } from "../../repositories/tournamentRepository";
import * as DB from "../../types/database";
import * as Api from "../../utils/apiHelpers";

interface TournamentIdParams extends ParamsDictionary {
  id: string;
}

interface EnablePollingBody {
  days: number;
}

export function protectedPollingRoutes(repo: TournamentRepository): Router {
  const router = express.Router();

  // Start or update polling for a tournament (user must own the tournament)
  const startPolling: RequestHandler<
    TournamentIdParams,
    Api.ApiResponse<Date>,
    EnablePollingBody
  > = async (req, res) => {
    const { id } = req.params;
    const { days } = req.body;
    const userId = req.user!.id;
    const tournamentId = parseInt(id, 10);
    await Api.withDataOr404(
      repo.findByIdForUser(tournamentId, userId),
      res,
      "Tournament not found",
      async (t) => {
        const pollUntil = new Date();
        pollUntil.setDate(pollUntil.getDate() + days);
        await repo.updatePollUntil(tournamentId, pollUntil);
        res.json(Api.success(pollUntil));
      },
    );
  };

  // Stop polling for a tournament (user must own the tournament)
  const stopPolling: RequestHandler<
    TournamentIdParams,
    Api.ApiResponse<{}>,
    {}
  > = Api.withErrorHandling(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const tournamentId = parseInt(id, 10);
    await Api.withDataOr404(
      repo.findByIdForUser(tournamentId, userId),
      res,
      "Tournament not found",
      async (t) => {
        await repo.stopPolling(tournamentId);
        res.json(Api.success({}));
      },
    );
  });

  router.post("/:id/polling", startPolling);
  router.delete("/:id/polling", stopPolling);

  return router;
}
