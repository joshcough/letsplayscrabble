// src/routes/tournaments.js
const express = require("express");
const db = require("../config/database");

function createAdminRoutes(tournamentRepository, currentMatchRepository, io) {
  const router = express.Router();

  router.post("/match/current", async (req, res) => {
    const { player1Id, player2Id, divisionId, tournamentId } = req.body;

    try {
      const matchResult = await currentMatchRepository.create(
        player1Id,
        player2Id,
        divisionId,
        tournamentId,
      );
      const player1Stats = await tournamentRepository.findPlayerStats(
        tournamentId,
        divisionId,
        player1Id,
      );
      const player2Stats = await tournamentRepository.findPlayerStats(
        tournamentId,
        divisionId,
        player2Id,
      );

      console.log("Emitting matchUpdate with data:", [player1Stats, player2Stats]);
      io.emit("matchUpdate", [player1Stats, player2Stats]);
      res.json([player1Stats, player2Stats]);
    } catch (err) {
      console.error("Error updating match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/match/current", async (req, res) => {
    try {
      const match = await currentMatchRepository.getCurrentMatch();

      const player1Stats = await tournamentRepository.findPlayerStats(
        match.tournament_id,
        match.division_id,
        match.player1_id,
      );
      const player2Stats = await tournamentRepository.findPlayerStats(
        match.tournament_id,
        match.division_id,
        match.player2_id,
      );

      res.json([player1Stats, player2Stats]);
    } catch (err) {
      console.error("Error finding current match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // TODO: we need to fetch the players for the current match. its not good enough to get the current match data.

  return router;
}

module.exports = createAdminRoutes;
