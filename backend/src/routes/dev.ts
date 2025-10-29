import express, { Router, RequestHandler } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

import * as Api from "../utils/apiHelpers";
import { withErrorHandling } from "../utils/apiHelpers";
import { pool } from "../config/database";

const TOURNAMENT_FILES_DIR = join(__dirname, "../../../tools/generated-tournament-28-players");
const STATE_FILE = join(__dirname, "../../../tools/.dev-tournament-state.json");

// Helper to load state from file
function loadState(): string {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      console.log(`📂 Loaded dev tournament state: ${data.currentFile}`);
      return data.currentFile || "tournament_00_initial.js";
    }
  } catch (error) {
    console.error("Failed to load dev tournament state:", error);
  }
  return "tournament_00_initial.js";
}

// Helper to save state to file
function saveState(currentFile: string): void {
  try {
    writeFileSync(STATE_FILE, JSON.stringify({ currentFile }, null, 2));
    console.log(`💾 Saved dev tournament state: ${currentFile}`);
  } catch (error) {
    console.error("Failed to save dev tournament state:", error);
  }
}

// Load current state from file on startup
let currentDevTournamentFile = loadState();

// Available tournament progression files (generated programmatically for 30 rounds)
const AVAILABLE_FILES: Array<{ value: string; label: string }> = [
  { value: "tournament_00_initial.js", label: "00 - Initial (No Pairings)" },
];

// Generate entries for rounds 1-30
for (let round = 1; round <= 30; round++) {
  const pairingsNum = (round - 1) * 2 + 1;
  const completeNum = pairingsNum + 1;

  AVAILABLE_FILES.push(
    {
      value: `tournament_${pairingsNum.toString().padStart(2, '0')}_round${round}_pairings.js`,
      label: `${pairingsNum.toString().padStart(2, '0')} - Round ${round} Pairings`
    },
    {
      value: `tournament_${completeNum.toString().padStart(2, '0')}_round${round}_complete.js`,
      label: `${completeNum.toString().padStart(2, '0')} - Round ${round} Complete`
    }
  );
}

export default function createDevRoutes(): Router {
  const router = express.Router();

  // GET /api/dev/tourney.js - Serve the current dev tournament file
  const serveTourneyJs: RequestHandler = async (req, res) => {
    try {
      console.log(`📄 Serving dev tourney.js: ${currentDevTournamentFile}`);

      const filePath = join(TOURNAMENT_FILES_DIR, currentDevTournamentFile);
      const content = readFileSync(filePath, "utf-8");

      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(content);
    } catch (error) {
      console.error("Failed to serve tourney.js:", error);
      res.status(500).send("Failed to serve tournament file");
    }
  };

  // GET /api/dev/available-files - Get list of available tournament files
  const getAvailableFiles: RequestHandler<
    {},
    Api.ApiResponse<typeof AVAILABLE_FILES>
  > = withErrorHandling(async (req, res) => {
    res.json(Api.success(AVAILABLE_FILES));
  });

  // GET /api/dev/current-file - Get currently selected file
  const getCurrentFile: RequestHandler<
    {},
    Api.ApiResponse<{ file: string }>
  > = withErrorHandling(async (req, res) => {
    res.json(Api.success({ file: currentDevTournamentFile }));
  });

  // POST /api/dev/set-tournament - Update which file to serve
  const setTournament: RequestHandler<
    {},
    Api.ApiResponse<{ file: string }>,
    { file: string }
  > = withErrorHandling(async (req, res) => {
    const { file } = req.body;

    if (!file) {
      res.status(400).json(Api.failure("File name is required"));
      return;
    }

    // Validate file exists in available files
    if (!AVAILABLE_FILES.find(f => f.value === file)) {
      res.status(400).json(Api.failure(`Invalid file: ${file}`));
      return;
    }

    console.log(`🔄 Updating dev tournament from ${currentDevTournamentFile} to ${file}`);
    currentDevTournamentFile = file;
    saveState(currentDevTournamentFile);

    res.json(Api.success({ file: currentDevTournamentFile }));
  });

  // POST /api/dev/clear-games - Delete all games for a tournament
  const clearGames: RequestHandler<
    {},
    Api.ApiResponse<{ deletedCount: number }>,
    { tournamentId: number }
  > = withErrorHandling(async (req, res) => {
    const { tournamentId } = req.body;

    if (!tournamentId) {
      res.status(400).json(Api.failure("Tournament ID is required"));
      return;
    }

    console.log(`🧹 Clearing all games for tournament ${tournamentId}`);

    // Delete all games for this tournament (via divisions)
    const result = await pool.query(
      `DELETE FROM games
       WHERE division_id IN (
         SELECT id FROM divisions WHERE tournament_id = $1
       )`,
      [tournamentId]
    );

    const deletedCount = result.rowCount || 0;

    console.log(`✅ Deleted ${deletedCount} games for tournament ${tournamentId}`);

    // Also clear current_matches for this tournament
    await pool.query(
      "DELETE FROM current_matches WHERE tournament_id = $1",
      [tournamentId]
    );

    console.log(`✅ Cleared current_matches for tournament ${tournamentId}`);

    res.json(Api.success({ deletedCount }));
  });

  // Routes
  router.get("/tourney.js", serveTourneyJs);
  router.get("/available-files", getAvailableFiles);
  router.get("/current-file", getCurrentFile);
  router.post("/set-tournament", setTournament);
  router.post("/clear-games", clearGames);

  return router;
}
