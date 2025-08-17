import express, { Router } from "express";
import { RequestHandler } from "express-serve-static-core";

import * as Domain from "@shared/types/domain";
import { AdminPanelUpdateMessage } from "@shared/types/websocket";
import { Server as SocketIOServer } from "socket.io";

import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { CreateCurrentMatch, CurrentMatch } from "../types/currentMatch";
import * as Api from "../utils/apiHelpers";
import { withDataOr404, withErrorHandling } from "../utils/apiHelpers";
import {
  transformCurrentMatchToDomain,
  transformCreateCurrentMatchToDatabase,
} from "../utils/domainTransforms";

export default function createAdminRoutes(
  repo: CurrentMatchRepository,
  io: SocketIOServer,
): Router {
  const router = express.Router();

  const createMatch: RequestHandler<
    {},
    Api.ApiResponse<Domain.CurrentMatch>,
    Domain.CreateCurrentMatch
  > = withErrorHandling(async (req, res) => {
    // Transform domain input to database format
    const dbCreateMatch = transformCreateCurrentMatchToDatabase(req.body);
    const userId = req.user!.id;
    const dbMatch = await repo.create(
      userId,
      dbCreateMatch.tournament_id,
      dbCreateMatch.division_id,
      dbCreateMatch.round,
      dbCreateMatch.pairing_id,
    );

    const adminPanelUpdate: AdminPanelUpdateMessage = {
      userId,
      tournamentId: dbMatch.tournament_id,
      divisionId: dbMatch.division_id,
      divisionName: dbMatch.division_name,
      round: dbMatch.round,
      pairingId: dbMatch.pairing_id,
      timestamp: Date.now(),
    };

    io.emit("AdminPanelUpdate", adminPanelUpdate);

    // Transform database result to domain format for response
    const domainMatch = transformCurrentMatchToDomain(dbMatch);
    res.json(Api.success(domainMatch));
  });

  const getCurrentMatch: RequestHandler<
    {},
    Api.ApiResponse<Domain.CurrentMatch>
  > = withErrorHandling(async (req, res) => {
    await withDataOr404(
      repo.getCurrentMatch(req.user!.id),
      res,
      "No current match found",
      (dbCurrentMatch) => {
        // Transform database result to domain format for response
        const domainMatch = transformCurrentMatchToDomain(dbCurrentMatch);
        res.json(Api.success(domainMatch));
      },
    );
  });

  router.get("/match/current", getCurrentMatch);
  router.post("/match/current", createMatch);

  return router;
}
