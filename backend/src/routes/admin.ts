import express, { Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";
import { PlayerStats } from "@shared/types/tournament";
import { getPlayerRecentGames } from "../services/dataProcessing";

// Updated request body type
interface CreateMatchBody {
  tournamentId: number;
  divisionId: number;
  round: number;
  pairingId: number;
}

export default function createAdminRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
  io: SocketIOServer,
): Router {
  const router = express.Router();

  const createMatch: RequestHandler<{}, any, CreateMatchBody> = async (
    req,
    res,
  ) => {
    const { tournamentId, divisionId, round, pairingId } = req.body;

    try {
      const match = await currentMatchRepository.create(
        tournamentId,
        divisionId,
        round,
        pairingId,
      );

      const update = await tournamentRepository.getMatchWithPlayers(match);

      if (!update) {
        res.status(500).json({ error: "Failed to process match data" });
        return;
      }

      io.emit("matchUpdate", update);
      res.json(update);
    } catch (error) {
      console.error("Error updating match:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  router.post("/match/current", createMatch);

  return router;
}
