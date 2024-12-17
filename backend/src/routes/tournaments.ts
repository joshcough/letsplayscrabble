import express, { Router, Request, Response } from "express";
import { ParamsDictionary, RequestHandler } from "express-serve-static-core";
import { TournamentRepository } from "../repositories/tournamentRepository";
import { loadTournamentFile } from "../services/dataProcessing";

// Request types
interface CreateTournamentBody {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}

interface EnablePollingBody {
  days: number;
}

interface TournamentIdParams extends ParamsDictionary {
  id: string;
}

interface TournamentNameParams extends ParamsDictionary {
  name: string;
}

export function protectedTournamentRoutes(
  tournamentRepository: TournamentRepository,
): Router {
  const router = express.Router();

  // Get all tournaments
  const getAllTournaments: RequestHandler = async (_req, res) => {
    try {
      const result = await tournamentRepository.findAll();
      res.json(result);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Get tournament by ID
  const getTournamentById: RequestHandler<TournamentIdParams> = async (
    req,
    res,
  ) => {
    try {
      const t = await tournamentRepository.findById(
        parseInt(req.params.id, 10),
      );
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Get tournament by name
  const getTournamentByName: RequestHandler<TournamentNameParams> = async (
    req,
    res,
  ) => {
    try {
      const t = await tournamentRepository.findByName(req.params.name);
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Create tournament
  const createTournament: RequestHandler<
    {},
    any,
    CreateTournamentBody
  > = async (req, res) => {
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
      console.error("Database error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // start or update polling for a tournament
  const startPolling: RequestHandler<
    TournamentIdParams,
    any,
    EnablePollingBody
  > = async (req, res) => {
    const { id } = req.params;
    const { days } = req.body;

    try {
      const pollUntil = new Date();
      pollUntil.setDate(pollUntil.getDate() + days);
      await tournamentRepository.updatePollUntil(parseInt(id, 10), pollUntil);
      res.json({ message: "Polling enabled", pollUntil });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // stop polling for a tournament
  const stopPolling: RequestHandler<TournamentIdParams> = async (req, res) => {
    const { id } = req.params;

    try {
      await tournamentRepository.stopPolling(parseInt(id, 10));
      res.json({ message: "Polling disabled" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  router.get("/", getAllTournaments);
  router.get("/:id", getTournamentById);
  router.get("/by-name/:name", getTournamentByName);
  router.post("/", createTournament);
  router.post("/:id/polling", startPolling);
  router.delete("/:id/polling", stopPolling);

  return router;
}

export function unprotectedTournamentRoutes(
  tournamentRepository: TournamentRepository,
): Router {
  const router = express.Router();

  // Get all tournaments
  const getAllTournaments: RequestHandler = async (_req, res) => {
    try {
      const result = await tournamentRepository.findAll();
      res.json(result);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Get tournament by ID
  const getTournamentById: RequestHandler<TournamentIdParams> = async (
    req,
    res,
  ) => {
    try {
      const t = await tournamentRepository.findById(
        parseInt(req.params.id, 10),
      );
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Get tournament by name
  const getTournamentByName: RequestHandler<TournamentNameParams> = async (
    req,
    res,
  ) => {
    try {
      const t = await tournamentRepository.findByName(req.params.name);
      if (t === null) {
        res.status(404).json({ message: "Tournament not found" });
        return;
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  router.get("/", getAllTournaments);
  router.get("/:id", getTournamentById);
  router.get("/by-name/:name", getTournamentByName);

  return router;
}
