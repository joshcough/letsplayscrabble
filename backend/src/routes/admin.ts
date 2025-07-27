import express, { Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";
import { PlayerStats } from "@shared/types/tournament";
import { getPlayerRecentGames } from "../services/dataProcessing";
import { AdminPanelUpdateMessage } from "@shared/types/websocket";

export default function createAdminRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
  io: SocketIOServer,
): Router {
  const router = express.Router();

//   const createMatch: RequestHandler<{}, any, CurrentMatch> = async (
//     req,
//     res,
//   ) => {
//     const { tournament_id, division_id, round, pairing_id } = req.body;
//
//     try {
//       // Get userId from the authenticated user
//       const userId = req.user!.id;
//
//       const match = await currentMatchRepository.create(
//         userId,
//         tournament_id,
//         division_id,
//         round,
//         pairing_id,
//       );
//
//       const adminUpdate: CurrentMatch = {
//         tournament_id: match.tournament_id,
//         division_id: match.division_id,
//         round: match.round,
//         pairing_id: match.pairing_id
//       };
//
//       // Broadcast with user context
//       io.emit("AdminPanelUpdate", { userId, ...adminUpdate } as AdminPanelUpdateMessage);
//
//       // Still return the full data for the API response
//       const update = await tournamentRepository.getMatchWithPlayers(match);
//       if (!update) {
//         res.status(500).json({ error: "Failed to process match data" });
//         return;
//       }
//       res.json(update);
//     } catch (error) {
//       console.error("Error updating match:", error);
//       res.status(500).json({
//         error: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };
//
//   const getCurrentMatch: RequestHandler = async (req, res) => {
//     try {
//       const userId = req.user!.id;
//
//       const currentMatch = await currentMatchRepository.getCurrentMatch(userId);
//
//       if (!currentMatch) {
//         res.status(404).json({ error: "No current match found" });
//         return;
//       }
//
//       res.json(currentMatch);
//     } catch (error) {
//       console.error("Error getting current match:", error);
//       res.status(500).json({
//         error: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };
//
//   router.get("/match/current", getCurrentMatch);
//   router.post("/match/current", createMatch);

  return router;
}