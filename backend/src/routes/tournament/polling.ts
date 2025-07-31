import express, { Router, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { TournamentRepository } from "../../repositories/tournamentRepository";
import * as DB from "@shared/types/database";
import * as Api from "../../utils/apiHelpers";

interface TournamentIdParams extends ParamsDictionary {
  id: string;
}

interface EnablePollingBody {
  days: number;
}

export function protectedPollingRoutes(
  tournamentRepository: TournamentRepository,
): Router {
  const router = express.Router();

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
      const tournamentId = parseInt(id, 10);

      // Check ownership
      const isOwner = await tournamentRepository.isOwner(tournamentId, userId);
      if (!isOwner) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }

      const pollUntil = new Date();
      pollUntil.setDate(pollUntil.getDate() + days);
      await tournamentRepository.updatePollUntil(tournamentId, pollUntil);
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
      const tournamentId = parseInt(id, 10);

      // Check ownership
      const isOwner = await tournamentRepository.isOwner(tournamentId, userId);
      if (!isOwner) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }

      await tournamentRepository.stopPolling(tournamentId);
      res.json({ message: "Polling disabled" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  router.post("/:id/polling", startPolling);
  router.delete("/:id/polling", stopPolling);

  return router;
}
