import express, { Router, RequestHandler } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import bcrypt from "bcrypt";

import * as Api from "../utils/apiHelpers";
import { withErrorHandling } from "../utils/apiHelpers";
import { pool } from "../config/database";

// Hardcoded paths for local dev testing
const TOURNAMENT_FILES_DIR = "/Users/joshuacough/work/letsplayscrabble/tools/generated-tournament-28-players";
const STATE_FILE = "/Users/joshuacough/work/letsplayscrabble/tools/.dev-tournament-state.json";

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

  // GET /api/dev/initial-dummy.js - Serve minimal dummy tournament data for initial creation
  const serveInitialDummy: RequestHandler = async (req, res) => {
    const dummyData = {
      name: "Dev Test Tournament",
      city: "Development",
      year: new Date().getFullYear(),
      lexicon: "TWL",
      divisions: [],
      players: []
    };

    const jsContent = `var tourneyData = ${JSON.stringify(dummyData, null, 2)};`;

    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(jsContent);
  };

  // GET /api/dev/tourney.js - Serve tournament data from database
  const serveTourneyJs: RequestHandler = async (req, res) => {
    try {
      // Get current version_id from dev_tournament_state
      const stateResult = await pool.query(
        "SELECT version_id FROM dev_tournament_state LIMIT 1"
      );

      const versionId = stateResult.rows[0]?.version_id;

      if (!versionId) {
        res.status(404).send("No version selected in dev_tournament_state");
        return;
      }

      // Get the tournament data for this version
      const versionResult = await pool.query(
        "SELECT data FROM tournament_data_versions WHERE id = $1",
        [versionId]
      );

      if (versionResult.rows.length === 0) {
        res.status(404).send("Version not found");
        return;
      }

      const tournamentData = versionResult.rows[0].data;

      console.log(`📄 Serving dev tourney.js from version_id: ${versionId}`);

      // Format as JavaScript variable (same format as the files)
      const jsContent = `var tourneyData = ${JSON.stringify(tournamentData, null, 2)};`;

      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(jsContent);
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

  // POST /api/dev/set-version - Set which version to serve
  const setVersion: RequestHandler<
    {},
    Api.ApiResponse<{ versionId: number }>,
    { versionId: number }
  > = withErrorHandling(async (req, res) => {
    const { versionId } = req.body;

    if (!versionId) {
      res.status(400).json(Api.failure("versionId is required"));
      return;
    }

    console.log(`🔄 Setting dev tournament to version_id: ${versionId}`);

    await pool.query(
      "UPDATE dev_tournament_state SET version_id = $1, updated_at = NOW()",
      [versionId]
    );

    res.json(Api.success({ versionId }));
  });

  // POST /api/dev/load-progression-files - Load all 61 progression files into versions table
  const loadProgressionFiles: RequestHandler<
    {},
    Api.ApiResponse<{ count: number; tournamentId: number }>,
    { tournamentId: number }
  > = withErrorHandling(async (req, res) => {
    const { tournamentId } = req.body;

    if (!tournamentId) {
      res.status(400).json(Api.failure("tournamentId is required"));
      return;
    }

    console.log(`📥 Loading progression files for tournament ${tournamentId}`);

    let count = 0;

    // Load all 61 files and insert into tournament_data_versions
    for (const fileInfo of AVAILABLE_FILES) {
      const filePath = join(TOURNAMENT_FILES_DIR, fileInfo.value);
      const content = readFileSync(filePath, "utf-8");

      // Extract tournament data from JavaScript file
      // Format is: var tourneyData = { ... };
      const objectText = content.substring(content.indexOf("{"));
      const evaluator = new Function("return " + objectText);
      const data = evaluator();

      // Insert into tournament_data_versions
      await pool.query(
        `INSERT INTO tournament_data_versions (tournament_id, data, created_at)
         VALUES ($1, $2, NOW())`,
        [tournamentId, JSON.stringify(data)]
      );

      count++;
    }

    console.log(`✅ Loaded ${count} progression files for tournament ${tournamentId}`);

    res.json(Api.success({ count, tournamentId }));
  });

  // POST /api/dev/start-simulation - Prepare tournament for simulation
  const startSimulation: RequestHandler<
    {},
    Api.ApiResponse<{ tournamentId: number }>,
    { tournamentId: number }
  > = withErrorHandling(async (req, res) => {
    const { tournamentId } = req.body;

    if (!tournamentId) {
      res.status(400).json(Api.failure("tournamentId is required"));
      return;
    }

    console.log(`🎬 Starting simulation for tournament ${tournamentId}`);

    // Update tournament_data to point to dev endpoint and disable version saving
    await pool.query(
      `UPDATE tournament_data
       SET data_url = 'http://localhost:3001/api/dev/tourney.js',
           poll_until = NOW() + INTERVAL '7 days'
       WHERE tournament_id = $1`,
      [tournamentId]
    );

    // Set save_versions = false on tournament
    await pool.query(
      `UPDATE tournaments
       SET save_versions = false
       WHERE id = $1`,
      [tournamentId]
    );

    console.log(`✅ Tournament ${tournamentId} ready for simulation`);

    res.json(Api.success({ tournamentId }));
  });

  // POST /api/dev/stop-simulation - Stop simulation and disable polling
  const stopSimulation: RequestHandler<
    {},
    Api.ApiResponse<{ tournamentId: number }>,
    { tournamentId: number }
  > = withErrorHandling(async (req, res) => {
    const { tournamentId } = req.body;

    if (!tournamentId) {
      res.status(400).json(Api.failure("tournamentId is required"));
      return;
    }

    console.log(`🛑 Stopping simulation for tournament ${tournamentId}`);

    // Disable polling
    await pool.query(
      `UPDATE tournament_data
       SET poll_until = NULL
       WHERE tournament_id = $1`,
      [tournamentId]
    );

    console.log(`✅ Simulation stopped for tournament ${tournamentId}`);

    res.json(Api.success({ tournamentId }));
  });

  // GET /api/dev/versions/:tournamentId - Get all versions for a tournament
  const getVersions: RequestHandler<
    { tournamentId: string },
    Api.ApiResponse<Array<{ id: number; tournament_id: number; created_at: Date }>>
  > = withErrorHandling(async (req, res) => {
    const tournamentId = parseInt(req.params.tournamentId);

    if (isNaN(tournamentId)) {
      res.status(400).json(Api.failure("Invalid tournament ID"));
      return;
    }

    // Get versions (just id, tournament_id, created_at - not the full data)
    const versions = await pool.query(
      `SELECT id, tournament_id, created_at
       FROM tournament_data_versions
       WHERE tournament_id = $1
       ORDER BY created_at ASC`,
      [tournamentId]
    );

    res.json(Api.success(versions.rows));
  });

  // GET /api/dev/users - Get all users
  const getUsers: RequestHandler<
    {},
    Api.ApiResponse<Array<{ id: number; username: string }>>
  > = withErrorHandling(async (req, res) => {
    const users = await pool.query(
      "SELECT id, username FROM users ORDER BY id ASC"
    );

    res.json(Api.success(users.rows));
  });

  // POST /api/dev/create-user - Create a new user
  const createUser: RequestHandler<
    {},
    Api.ApiResponse<{ id: number; username: string }>,
    { username: string; password: string }
  > = withErrorHandling(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json(Api.failure("Username and password are required"));
      return;
    }

    console.log(`🔧 Creating user: ${username}`);

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, passwordHash]
    );

    console.log(`✅ User created: ${username} (ID: ${result.rows[0].id})`);

    res.json(Api.success(result.rows[0]));
  });

  // POST /api/dev/delete-user - Delete a user
  const deleteUser: RequestHandler<
    {},
    Api.ApiResponse<{ userId: number }>,
    { userId: number }
  > = withErrorHandling(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json(Api.failure("userId is required"));
      return;
    }

    if (userId === 1) {
      res.status(400).json(Api.failure("Cannot delete the main admin user"));
      return;
    }

    console.log(`🗑️  Deleting user ID: ${userId}`);

    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    console.log(`✅ User deleted: ${userId}`);

    res.json(Api.success({ userId }));
  });

  // Routes
  router.get("/initial-dummy.js", serveInitialDummy);
  router.get("/tourney.js", serveTourneyJs);
  router.get("/available-files", getAvailableFiles);
  router.get("/current-file", getCurrentFile);
  router.post("/set-tournament", setTournament);
  router.post("/clear-games", clearGames);
  router.post("/set-version", setVersion);
  router.post("/load-progression-files", loadProgressionFiles);
  router.post("/start-simulation", startSimulation);
  router.post("/stop-simulation", stopSimulation);
  router.get("/versions/:tournamentId", getVersions);
  router.get("/users", getUsers);
  router.post("/create-user", createUser);
  router.post("/delete-user", deleteUser);

  return router;
}
