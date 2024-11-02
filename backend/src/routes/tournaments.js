// src/routes/tournaments.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const {
  loadTournamentFile,
  calculateStandings,
} = require("../services/dataProcessing");

// Get all tournaments
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tournaments ORDER BY year DESC, name ASC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all tournament names
router.get("/names", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT name FROM tournaments ORDER BY year DESC, name ASC"
    );
    res.json(result.rows.map(row => row.name));
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Shared function to process tournament data
const processTournament = async (tournamentRecord) => {
  if (!tournamentRecord) {
    return null;
  }

  const tourneyData = await loadTournamentFile(tournamentRecord.data_url);
  const processedDivisions = tourneyData.divisions.map((division) => {
    console.log("division", division);
    const standings = calculateStandings(division);
    console.log("standings", standings);
    return standings;
  });

  return {
    ...tournamentRecord,
    divisions: tourneyData.divisions,
    standings: processedDivisions
  };
};

// Get tournament by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tournaments WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const processedTourney = await processTournament(result.rows[0]);
    console.log("tourney", processedTourney);
    res.json(processedTourney);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get tournament by name
router.get("/by-name/:name", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tournaments WHERE name = $1",
      [req.params.name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const processedTourney = await processTournament(result.rows[0]);
    console.log("tourney", processedTourney);
    res.json(processedTourney);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: error.message });
  }
});


// Create tournament
router.post("/", async (req, res) => {
  const { name, city, year, lexicon, longFormName, dataUrl } = req.body;

  try {
    const tourneyData = await loadTournamentFile(dataUrl);
    console.log(tourneyData);

    const processedDivisions = tourneyData.divisions.map((division) => {
      console.log("division", division);
      return calculateStandings(division);
    });

    // To print the results:
    processedDivisions.forEach((division) => {
      console.log(division);
    });

    const result = await db.query(
      `INSERT INTO tournaments (name, city, year, lexicon, long_form_name, data_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, city, year, lexicon, longFormName, dataUrl],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
