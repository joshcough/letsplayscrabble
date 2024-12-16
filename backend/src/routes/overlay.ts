import express, { Router } from "express";
import { RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { CurrentMatchRepository } from "../repositories/currentMatchRepository";
import { MatchWithPlayers } from "@shared/types/admin";
import { CurrentMatch } from "@shared/types/currentMatch";

export default function createOverlayRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
): Router {
  const router = express.Router();

  const addPlayers = async (match: CurrentMatch): Promise<MatchWithPlayers> => {
    const tournament = await tournamentRepository.findById(match.tournament_id);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Get the pairing details
    const divisionPairings = tournament.divisionPairings[match.division_id];
    if (!divisionPairings) {
      throw new Error(`Division ${match.division_id} pairings not found`);
    }

    const roundPairings = divisionPairings.find(
      (rp) => rp.round === match.round,
    );
    if (!roundPairings) {
      throw new Error(`Round ${match.round} not found`);
    }

    const pairing = roundPairings.pairings[match.pairing_id];
    if (!pairing) {
      throw new Error(`Pairing ${match.pairing_id} not found`);
    }

    // Get player stats using the player IDs from the pairing
    const playerStats = await tournamentRepository.findTwoPlayerStats(
      match.tournament_id,
      match.division_id,
      pairing.player1.id,
      pairing.player2.id,
    );

    return {
      matchData: match,
      tournament: playerStats.tournament,
      players: [playerStats.player1, playerStats.player2],
    };
  };

  const getCurrentMatch: RequestHandler = async (_req, res) => {
    try {
      const match = await currentMatchRepository.getCurrentMatch();

      // If no match exists, return null matchData
      if (!match) {
        res.json({ matchData: null });
        return;
      }

      // Get the complete match data with players and tournament info
      const matchWithPlayers = await addPlayers(match);
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
