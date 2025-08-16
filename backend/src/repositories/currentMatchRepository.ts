import { Pool } from "pg";

import { CurrentMatch } from "../types/currentMatch";

export class CurrentMatchRepository {
  constructor(private readonly db: Pool) {}

  async create(
    userId: number,
    tournamentId: number,
    divisionId: number,
    round: number,
    pairingId: number,
  ): Promise<CurrentMatch> {
    const res = await this.db.query<CurrentMatch>(
      `INSERT INTO current_matches (user_id, tournament_id, division_id, round, pairing_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET tournament_id = $2,
           division_id = $3,
           round = $4,
           pairing_id = $5,
           updated_at = CURRENT_TIMESTAMP
       RETURNING tournament_id, division_id, round, pairing_id, updated_at`,
      [userId, tournamentId, divisionId, round, pairingId],
    );
    return res.rows[0];
  }

  async getCurrentMatch(userId: number): Promise<CurrentMatch | null> {
    try {
      const res = await this.db.query<CurrentMatch>(
        `SELECT cm.tournament_id, cm.division_id, cm.round, cm.pairing_id, cm.updated_at, d.name as division_name
         FROM current_matches cm
         JOIN divisions d ON cm.division_id = d.id
         WHERE cm.user_id = $1`,
        [userId],
      );

      if (!res.rows.length) {
        return null;
      }

      return res.rows[0];
    } catch (error) {
      console.error("Error fetching current match for user:", userId, error);
      throw error;
    }
  }
}
