// src/routes/tournaments.js
const express = require("express");
const db = require("../config/database");

function createAdminRoutes(tournamentRepository, currentMatchRepository, io) {
  const router = express.Router();

  router.post("/match/current", async (req, res) => {
    const { player1Id, player2Id, divisionId, tournamentId } = req.body;

    console.log("in /match/current", player1Id, player2Id, divisionId, tournamentId)

    try {
      const matchResult = await currentMatchRepository.create(player1Id, player2Id, divisionId, tournamentId);
      const player1Stats = await tournamentRepository.findPlayerStats(tournamentId, divisionId, player1Id)
      const player2Stats = await tournamentRepository.findPlayerStats(tournamentId, divisionId, player2Id)

      const matchData = {
        ...matchResult.rows[0],
        players: [player1Stats, player2Stats],
      };

      console.log("Emitting matchUpdate with data:", matchData);
      io.emit("matchUpdate", matchData);
      res.json(matchData);
    } catch (err) {
      console.error("Error updating match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/match/current", async (req, res) => {
    try {
      const match = await currentMatchRepository.getCurrentMatch();
      console.log("match", match)
      res.json(match);
    } catch (err) {
      console.error("Error finding current match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createAdminRoutes;
