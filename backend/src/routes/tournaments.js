// src/routes/tournaments.js
const express = require("express");
const db = require("../config/database");
const {
  loadTournamentFile,
  calculateStandings,
  processTournament,
} = require("../services/dataProcessing");

function createTournamentRoutes(tournamentRepository) {
  const router = express.Router();

  // Get all tournaments
  router.get("/", async (req, res) => {
    try {
      const result = await tournamentRepository.findAll();
      res.json(result);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all tournament names
  router.get("/names", async (req, res) => {
    try {
      const result = await tournamentRepository.findAllNames(req.params.id);
      console.log("names", result);
      res.json(result);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get tournament by ID
  router.get("/:id", async (req, res) => {
    try {
      const t = await tournamentRepository.findById(req.params.id);
      if (t === null) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get tournament by name
  router.get("/by-name/:name", async (req, res) => {
    try {
      const t = await tournamentRepository.findByName(req.params.name);
      if (t === null) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(t);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create tournament
  router.post("/", async (req, res) => {
    const { name, city, year, lexicon, longFormName, dataUrl } = req.body;
    const rawData = await loadTournamentFile(dataUrl);

    try {
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
      res.status(400).json({ message: error.message });
    }
  });

  return router;
}

module.exports = createTournamentRoutes;
