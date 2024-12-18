import express, { Router } from "express";
import { RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";
import { getPlayerRecentGames } from "../services/dataProcessing";

export default function createOverlayRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
): Router {
  const router = express.Router();

  const getCurrentMatch: RequestHandler = async (_req, res) => {
    try {
      const match = await currentMatchRepository.getCurrentMatch();

      // If no match exists, return null matchData
      if (!match) {
        res.json({ matchData: null });
        return;
      }

      // Get the complete match data with players and tournament info
      const matchWithPlayers =
        await tournamentRepository.getMatchWithPlayers(match);
      res.json(matchWithPlayers); // This should now have matchData, tournament, and players
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
