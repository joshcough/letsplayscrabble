import express, { Router, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";
import { PlayerStats } from "@shared/types/tournament"; // Added this import

// Request body type for creating a match
interface CreateMatchBody {
  player1Id: number;
  player2Id: number;
  divisionId: number;
  tournamentId: number;
}

export default function createAdminRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
  io: SocketIOServer,
): Router {
  const router = express.Router();

  const addPlayers = async (match: CurrentMatch): Promise<MatchWithPlayers> => {
    const playerStats = await tournamentRepository.findTwoPlayerStats(
      match.tournament_id,
      match.division_id,
      match.player1_id,
      match.player2_id,
    );

    return {
      matchData: match,
      tournament: playerStats.tournament,
      players: [playerStats.player1, playerStats.player2],
    };
  };

  const createMatch: RequestHandler<{}, any, CreateMatchBody> = async (
    req,
    res,
  ) => {
    const { player1Id, player2Id, divisionId, tournamentId } = req.body;

    try {
      const match = await currentMatchRepository.create(
        player1Id,
        player2Id,
        divisionId,
        tournamentId,
      );

      const update = await addPlayers(match);

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
