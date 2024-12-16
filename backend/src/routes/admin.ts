import express, { Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";
import { PlayerStats } from "@shared/types/tournament";

// Updated request body type
interface CreateMatchBody {
  tournamentId: number;
  divisionId: number;
  round: number;
  pairingId: number;
}

export default function createAdminRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
  io: SocketIOServer,
): Router {
  const router = express.Router();

  const addPlayers = async (match: CurrentMatch): Promise<MatchWithPlayers> => {
    const tournament = await tournamentRepository.findById(match.tournament_id);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Get the pairing details from the tournament data
    const divisionPairings = tournament.divisionPairings[match.division_id];
    const roundPairings = divisionPairings.find(
      (rp) => rp.round === match.round,
    );
    if (!roundPairings) {
      throw new Error("Round not found");
    }

    const pairing = roundPairings.pairings[match.pairing_id];
    if (!pairing) {
      throw new Error("Pairing not found");
    }

    // Get full player stats for both players
    const playerStats = await tournamentRepository.findTwoPlayerStats(
      match.tournament_id,
      match.division_id,
      pairing.player1.id,
      pairing.player2.id,
    );

    return {
      matchData: match,
      tournament: {
        name: tournament.name,
        lexicon: tournament.lexicon,
      },
      players: [playerStats.player1, playerStats.player2],
    };
  };

  const createMatch: RequestHandler<{}, any, CreateMatchBody> = async (
    req,
    res,
  ) => {
    const { tournamentId, divisionId, round, pairingId } = req.body;

    try {
      const match = await currentMatchRepository.create(
        tournamentId,
        divisionId,
        round,
        pairingId,
      );

      const update = await addPlayers(match);

      if (!update) {
        res.status(500).json({ error: "Failed to process match data" });
        return;
      }

      io.emit("matchUpdate", update);
      res.json(update);
    } catch (error) {
      console.error("Error updating match:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  router.post("/match/current", createMatch);

  return router;
}
