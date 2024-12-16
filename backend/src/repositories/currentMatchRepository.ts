import { Pool } from "pg";
import { CurrentMatch } from "@shared/types/currentMatch";

export class CurrentMatchRepository {
  constructor(private readonly db: Pool) {}

  async create(
    tournamentId: number,
    divisionId: number,
    round: number,
    pairingId: number,
  ): Promise<CurrentMatch> {
    const res = await this.db.query<CurrentMatch>(
      `INSERT INTO current_matches (tournament_id, division_id, round, pairing_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET tournament_id = $1,
           division_id = $2,
           round = $3,
           pairing_id = $4,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tournamentId, divisionId, round, pairingId],
    );
    return res.rows[0];
  }

  async getCurrentMatch(): Promise<CurrentMatch | null> {
    try {
      const res = await this.db.query<CurrentMatch>(
        `SELECT tournament_id, division_id, round, pairing_id, updated_at
         FROM current_matches
         LIMIT 1`,
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
