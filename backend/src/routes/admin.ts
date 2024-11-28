import express, { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { TournamentRepository } from '../repositories/tournamentRepository';
import { CurrentMatchRepository } from '../repositories/currentMatchRepository';
import { CreateMatchRequest, MatchWithPlayers } from '../types/admin';
import { CurrentMatch } from '../types/currentMatch';

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

  router.post('/match/current', async (req: Request<{}, {}, CreateMatchRequest>, res: Response) => {
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
        throw new Error('Failed to process match data');
      }

      io.emit('matchUpdate', update);
      res.json(update);
    } catch (error) {
      console.error('Error updating match:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  router.get('/match/current', async (_req: Request, res: Response) => {
    try {
      const match = await currentMatchRepository.getCurrentMatch();
      const matchWithPlayers = await addPlayers(match);

      if (!matchWithPlayers) {
        return res.status(404).json({ error: 'No current match found' });
      }

      res.json(matchWithPlayers);
    } catch (error) {
      console.error('Error finding current match:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return router;
}