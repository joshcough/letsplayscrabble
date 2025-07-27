import express, { Router } from "express";
import { RequestHandler } from "express-serve-static-core";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";
// import { getPlayerRecentGames } from "../services/dataProcessing";

export default function createOverlayRoutes(
  currentMatchRepository: CurrentMatchRepository,
): Router {
  const router = express.Router();

  // Helper to get userId from params and validate it
  const getUserIdFromParams = (req: express.Request): number | null => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return null;
    }
    return userId;
  };

  const getCurrentMatch: RequestHandler = async (req, res) => {
    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      const currentMatch = await currentMatchRepository.getCurrentMatch(userId);
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

  router.get("/users/:userId/match/current", getCurrentMatch);
  return router;
}