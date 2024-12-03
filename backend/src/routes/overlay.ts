import express, { Router, Response } from "express";
import { RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";
import { PlayerStats } from "@shared/types/tournament";

export default function createOverlayRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
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

  const getCurrentMatch: RequestHandler = async (_req, res) => {
    try {
      const match = await currentMatchRepository.getCurrentMatch();

      if (!match) {
        res.status(404).json({ error: "No current match found" });
        return;
      }

      const matchWithPlayers = await addPlayers(match);
      res.json(matchWithPlayers);
    } catch (error) {
      console.error("Error finding current match:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  router.get("/match/current", getCurrentMatch);

  return router;
}
