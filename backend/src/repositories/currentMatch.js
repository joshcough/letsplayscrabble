const { processTournament } = require("../services/dataProcessing");

class CurrentMatchRepository {
  constructor(db) {
    this.db = db;
  }

  async create(player1Id, player2Id, divisionId, tournamentId) {
    console.log("in create", player1Id, player2Id, divisionId, tournamentId);
    const res = await this.db.query(
      `INSERT INTO current_matches (player1_id, player2_id, division_id, tournament_id) VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET player1_id = $1, player2_id = $2, division_id = $3, tournament_id = $4
      RETURNING *`,
      [player1Id, player2Id, divisionId, tournamentId],
    );
    return res.rows[0];
  }

  async getCurrentMatch() {
    try {
      const res = await this.db.query(
        "SELECT player1_id, player2_id, division_id, tournament_id FROM current_matches LIMIT 1",
        [],
      );

      if (!res.rows.length) {
        return null; // Or throw new Error('No current match found')
      }

      console.log(res.rows[0]);
      return res.rows[0];
    } catch (error) {
      // Log the error or handle it appropriately
      console.error("Error fetching current match:", error);
      throw error;
    }
  }
}

module.exports = CurrentMatchRepository;
