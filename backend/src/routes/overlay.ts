import express, { Router } from "express";

import * as Domain from "@shared/types/domain";

import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import * as Api from "../utils/apiHelpers";
import { transformCurrentMatchToDomain } from "../utils/domainTransforms";

export default function createOverlayRoutes(
  currentMatchRepository: CurrentMatchRepository,
): Router {
  const router = express.Router();

  const getCurrentMatch = Api.withValidatedUserId(async (userId, req, res) => {
    await Api.withDataOr404(
      currentMatchRepository.getCurrentMatch(userId),
      res,
      "No current match found",
      async (dbCurrentMatch) => {
        // Transform database result to domain format
        const domainMatch = transformCurrentMatchToDomain(dbCurrentMatch);
        res.json(Api.success(domainMatch));
      },
    );
  });

  router.get("/users/:userId/match/current", getCurrentMatch);
  return router;
}
