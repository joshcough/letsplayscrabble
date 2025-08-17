import express, { Router } from "express";
import { RequestHandler } from "express-serve-static-core";

import * as Domain from "@shared/types/domain";

import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "../types/admin";
import { CurrentMatch } from "../types/currentMatch";
import * as Api from "../utils/apiHelpers";
import { transformCurrentMatchToDomain } from "../utils/domainTransforms";

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

  const getCurrentMatch: RequestHandler<
    { userId: string },
    Api.ApiResponse<Domain.CurrentMatch>
  > = async (req, res) => {
    try {
      const userId = getUserIdFromParams(req);
      if (userId === null) {
        res.status(400).json(Api.failure("Invalid user ID"));
        return;
      }
      const dbCurrentMatch =
        await currentMatchRepository.getCurrentMatch(userId);
      if (!dbCurrentMatch) {
        res.status(404).json(Api.failure("No current match found"));
        return;
      }

      // Transform database result to domain format
      const domainMatch = transformCurrentMatchToDomain(dbCurrentMatch);
      res.json(Api.success(domainMatch));
    } catch (error) {
      console.error("Error fetching current match basic data:", error);
      res
        .status(500)
        .json(
          Api.failure(error instanceof Error ? error.message : "Unknown error"),
        );
    }
  };

  router.get("/users/:userId/match/current", getCurrentMatch);
  return router;
}
