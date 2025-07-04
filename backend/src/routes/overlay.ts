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

  const getCurrentMatchForStatsDeleteThisFunction: RequestHandler = async (_req, res) => {
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

  const getCurrentMatch: RequestHandler = async (_req, res) => {
    try {
      const currentMatch = await currentMatchRepository.getCurrentMatch();

      if (!currentMatch) {
        res.status(404).json({ error: "No current match found" });
        return;
      }

      res.json(currentMatch);
    } catch (error) {
      console.error("Error fetching current match basic data:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  router.get("/match/current_match_for_stats_delete_this_route", getCurrentMatchForStatsDeleteThisFunction);
  router.get("/match/current", getCurrentMatch);

  return router;
}