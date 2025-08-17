import express, { Router } from "express";

import * as Domain from "@shared/types/domain";

import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import * as Api from "../utils/apiHelpers";

export default function createOverlayRoutes(
  currentMatchRepository: CurrentMatchRepository,
): Router {
  const router = express.Router();

  const getCurrentMatch = Api.withValidatedUserId(async (userId, req, res) => {
    await Api.withDataOr404(
      currentMatchRepository.getCurrentMatch(userId),
      res,
      "No current match found",
      async (currentMatch) => {
        res.json(Api.success(currentMatch));
      },
    );
  });

  router.get("/users/:userId/match/current", getCurrentMatch);
  return router;
}
