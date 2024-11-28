import express, { Router, Request, Response } from 'express';
import { TournamentRepository } from '../repositories/tournamentRepository';
import { loadTournamentFile } from '../services/dataProcessing';

interface CreateTournamentRequest extends Request {
  body: {
    name: string;
    city: string;
    year: number;
    lexicon: string;
    longFormName: string;
    dataUrl: string;
  }
}

interface EnablePollingRequest extends Request {
  params: {
    id: string;
  };
  body: {
    days: number;
  }
}

interface TournamentIdRequest extends Request {
  params: {
    id: string;
  }
}

interface TournamentNameRequest extends Request {
  params: {
    name: string;
  }
}

export default function createTournamentRoutes(tournamentRepository: TournamentRepository): Router {
  const router = express.Router();

  // Get all tournaments
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const result = await tournamentRepository.findAll();
      res.json(result);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all tournament names
  router.get('/names', async (_req: Request, res: Response) => {
    try {
      const result = await tournamentRepository.findAllNames();
      res.json(result);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get tournament by ID
  router.get('/:id', async (req: TournamentIdRequest, res: Response) => {
    try {
      const t = await tournamentRepository.findById(parseInt(req.params.id, 10));
      if (t === null) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      res.json(t);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get tournament by name
  router.get('/by-name/:name', async (req: TournamentNameRequest, res: Response) => {
    try {
      const t = await tournamentRepository.findByName(req.params.name);
      if (t === null) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      res.json(t);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create tournament
  router.post('/', async (req: CreateTournamentRequest, res: Response) => {
    const { name, city, year, lexicon, longFormName, dataUrl } = req.body;

    try {
      const rawData = await loadTournamentFile(dataUrl);
      const tournament = await tournamentRepository.create({
        name,
        city,
        year,
        lexicon,
        longFormName,
        dataUrl,
        rawData,
      });

      res.status(201).json(tournament);
    } catch (error) {
      console.error('Database error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // start or update polling for a tournament
  router.post('/:id/polling', async (req: EnablePollingRequest, res: Response) => {
    const { id } = req.params;
    const { days } = req.body;

    try {
      const pollUntil = new Date();
      pollUntil.setDate(pollUntil.getDate() + days);
      await tournamentRepository.updatePollUntil(parseInt(id, 10), pollUntil);
      res.json({ message: 'Polling enabled', pollUntil });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // stop polling for a tournament
  router.delete('/:id/polling', async (req: TournamentIdRequest, res: Response) => {
    const { id } = req.params;

    try {
      await tournamentRepository.stopPolling(parseInt(id, 10));
      res.json({ message: 'Polling disabled' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return router;
}