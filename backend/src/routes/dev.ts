import express, { Router, RequestHandler } from "express";
import { readFileSync } from "fs";
import { join } from "path";

import * as Api from "../utils/apiHelpers";
import { withErrorHandling } from "../utils/apiHelpers";
import { pool } from "../config/database";

// In-memory storage for current dev tournament file
let currentDevTournamentFile = "tournament_00_initial.js";

const TOURNAMENT_FILES_DIR = join(__dirname, "../../../tools/generated-tournament-28-players");

// Available tournament progression files
const AVAILABLE_FILES = [
  { value: "tournament_00_initial.js", label: "00 - Initial (No Pairings)" },
  { value: "tournament_01_round1_pairings.js", label: "01 - Round 1 Pairings" },
  { value: "tournament_02_round1_complete.js", label: "02 - Round 1 Complete" },
  { value: "tournament_03_round2_pairings.js", label: "03 - Round 2 Pairings" },
  { value: "tournament_04_round2_complete.js", label: "04 - Round 2 Complete" },
  { value: "tournament_05_round3_pairings.js", label: "05 - Round 3 Pairings" },
  { value: "tournament_06_round3_complete.js", label: "06 - Round 3 Complete" },
  { value: "tournament_07_round4_pairings.js", label: "07 - Round 4 Pairings" },
  { value: "tournament_08_round4_complete.js", label: "08 - Round 4 Complete" },
  { value: "tournament_09_round5_pairings.js", label: "09 - Round 5 Pairings" },
  { value: "tournament_10_round5_complete.js", label: "10 - Round 5 Complete" },
  { value: "tournament_11_round6_pairings.js", label: "11 - Round 6 Pairings" },
  { value: "tournament_12_round6_complete.js", label: "12 - Round 6 Complete" },
  { value: "tournament_13_round7_pairings.js", label: "13 - Round 7 Pairings" },
  { value: "tournament_14_round7_complete.js", label: "14 - Round 7 Complete" },
];

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
