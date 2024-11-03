// src/routes/tournaments.js
const express = require("express");
const db = require("../config/database");

function createAdminRoutes(tournamentRepository, currentMatchRepository, io) {
  const router = express.Router();

  const addPlayers = async (match) => {
    console.log("adding players to match", match);
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
    return {
      matchData: match,
      players: [player1Stats, player2Stats],
    };
  };
  router.post("/match/current", async (req, res) => {
    const { player1Id, player2Id, divisionId, tournamentId } = req.body;
    try {
      const match = await currentMatchRepository.create(
        player1Id,
        player2Id,
        divisionId,
        tournamentId,
      );
      console.log("match in /match/current", match);
      const update = await addPlayers(match);
      console.log("Emitting matchUpdate with data:", update);
      io.emit("matchUpdate", update);
      res.json(update);
    } catch (err) {
      console.error("Error updating match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/match/current", async (req, res) => {
    try {
      const match = await currentMatchRepository.getCurrentMatch();
      const matchWithPlayers = await addPlayers(match);
      res.json(matchWithPlayers);
    } catch (err) {
      console.error("Error finding current match:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // TODO: we need to fetch the players for the current match. its not good enough to get the current match data.

  return router;
}

module.exports = createAdminRoutes;
