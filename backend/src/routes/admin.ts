import express, { Router, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { RequestHandler } from 'express-serve-static-core';
import { TournamentRepository } from '../repositories/tournamentRepository';
import { CurrentMatchRepository } from '../repositories/currentMatchRepository';
import { CurrentMatch } from '../types/currentMatch';
import { ProcessedPlayer } from '../types/tournament'; // Added this import

// Request body type for creating a match
interface CreateMatchBody {
  player1Id: number;
  player2Id: number;
  divisionId: number;
  tournamentId: number;
}

// Response type for match with players
interface MatchWithPlayers {
  matchData: CurrentMatch;
  tournament: {
    name: string;
    lexicon: string;
  };
  players: [ProcessedPlayer | undefined, ProcessedPlayer | undefined];
}

export default function createAdminRoutes(
  tournamentRepository: TournamentRepository,
  currentMatchRepository: CurrentMatchRepository,
  io: SocketIOServer
): Router {
  const router = express.Router();

  const addPlayers = async (match: CurrentMatch | null): Promise<MatchWithPlayers | null> => {
    if (!match) return null;

    const playerStats = await tournamentRepository.findTwoPlayerStats(
      match.tournament_id,
      match.division_id,
      match.player1_id,
      match.player2_id
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
      const matchWithPlayers = await addPlayers(match);

      if (!matchWithPlayers) {
        res.status(404).json({ error: 'No current match found' });
        return;
      }

      res.json(matchWithPlayers);
    } catch (error) {
      console.error('Error finding current match:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const createMatch: RequestHandler<{}, any, CreateMatchBody> = async (req, res) => {
    const { player1Id, player2Id, divisionId, tournamentId } = req.body;

    try {
      const match = await currentMatchRepository.create(
        player1Id,
        player2Id,
        divisionId,
        tournamentId
      );

      const update = await addPlayers(match);

      if (!update) {
        res.status(500).json({ error: 'Failed to process match data' });
        return;
      }

      io.emit('matchUpdate', update);
      res.json(update);
    } catch (error) {
      console.error('Error updating match:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  router.get('/match/current', getCurrentMatch);
  router.post('/match/current', createMatch);

  return router;
}