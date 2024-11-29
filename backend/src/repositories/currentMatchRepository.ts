import { Pool, QueryResult } from "pg";
import { CurrentMatch } from "@shared/types/currentMatch";

export class CurrentMatchRepository {
  constructor(private readonly db: Pool) {}

  async create(
    player1Id: number,
    player2Id: number,
    divisionId: number,
    tournamentId: number,
  ): Promise<CurrentMatch> {
    const res = await this.db.query<CurrentMatch>(
      `INSERT INTO current_matches (player1_id, player2_id, division_id, tournament_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET player1_id = $1, player2_id = $2, division_id = $3, tournament_id = $4
       RETURNING *`,
      [player1Id, player2Id, divisionId, tournamentId],
    );
    return res.rows[0];
  }

  async getCurrentMatch(): Promise<CurrentMatch | null> {
    try {
      const res = await this.db.query<CurrentMatch>(
        "SELECT player1_id, player2_id, division_id, tournament_id FROM current_matches LIMIT 1",
      );

      if (!res.rows.length) {
        return null;
      }

      return res.rows[0];
    } catch (error) {
      console.error("Error fetching current match:", error);
      throw error;
    }
  }
}
