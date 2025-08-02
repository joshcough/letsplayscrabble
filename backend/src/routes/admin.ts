import express, { Router } from "express";
import { RequestHandler } from "express-serve-static-core";

import { CreateCurrentMatch, CurrentMatch } from "@shared/types/currentMatch";
import { AdminPanelUpdateMessage } from "@shared/types/websocket";
import { Server as SocketIOServer } from "socket.io";

import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import * as Api from "../utils/apiHelpers";
import { withDataOr404, withErrorHandling } from "../utils/apiHelpers";

export default function createAdminRoutes(
  repo: CurrentMatchRepository,
  io: SocketIOServer,
): Router {
  const router = express.Router();

  const createMatch: RequestHandler<
    {},
    Api.ApiResponse<CurrentMatch>,
    CreateCurrentMatch
  > = withErrorHandling(async (req, res) => {
    const { tournament_id, division_id, round, pairing_id } = req.body;
    const userId = req.user!.id;
    const match = await repo.create(
      userId,
      tournament_id,
      division_id,
      round,
      pairing_id,
    );

    const adminPanelUpdate: AdminPanelUpdateMessage = {
      userId,
      tournamentId: match.tournament_id,
      divisionId: match.division_id,
      divisionName: match.division_name,
      round: match.round,
      pairingId: match.pairing_id,
      timestamp: Date.now(),
    };

    io.emit("AdminPanelUpdate", adminPanelUpdate);
    res.json(Api.success(match));
  });

  const getCurrentMatch: RequestHandler<
    {},
    Api.ApiResponse<CurrentMatch>
  > = async (req, res) => {
    await withDataOr404(
      repo.getCurrentMatch(req.user!.id),
      res,
      "No current match found",
      (currentMatch) => {
        res.json(Api.success(currentMatch));
      },
    );
  };

  router.get("/match/current", getCurrentMatch);
  router.post("/match/current", createMatch);

  return router;
}
