import { knexDb } from "../config/database";
import * as DB from "../types/database";
import * as Domain from "@shared/types/domain";

export class CrossTablesHeadToHeadRepository {
  /**
   * Store multiple head-to-head games in the database
   * Uses upsert pattern to handle duplicates gracefully
   */
  async storeHeadToHeadGames(games: Domain.HeadToHeadGame[]): Promise<void> {
    if (games.length === 0) return;

    const rows = games.map((game): Omit<DB.CrossTablesHeadToHeadRow, 'id' | 'created_at' | 'updated_at'> => ({
      game_id: game.gameid,
      date: game.date,
      player1_id: game.player1.playerid,
      player1_name: game.player1.name,
      player1_score: game.player1.score,
      player1_old_rating: game.player1.oldrating,
      player1_new_rating: game.player1.newrating,
      player1_position: game.player1.position || null,
      player2_id: game.player2.playerid,
      player2_name: game.player2.name,
      player2_score: game.player2.score,
      player2_old_rating: game.player2.oldrating,
      player2_new_rating: game.player2.newrating,
      player2_position: game.player2.position || null,
      annotated: game.annotated || null,
    }));

    // Use ON CONFLICT to handle duplicates (upsert pattern)
    await knexDb("cross_tables_head_to_head")
      .insert(rows)
      .onConflict("game_id")
      .merge([
        "date",
        "player1_name", "player1_score", "player1_old_rating", "player1_new_rating", "player1_position",
        "player2_name", "player2_score", "player2_old_rating", "player2_new_rating", "player2_position",
        "annotated", "updated_at"
      ]);

    console.log(`✅ Stored/updated ${rows.length} head-to-head games`);
  }

  /**
   * Get head-to-head games between specific players
   * Returns all historical games between any combination of the given player IDs
   */
  async getHeadToHeadGamesForPlayers(playerIds: number[]): Promise<DB.CrossTablesHeadToHeadRow[]> {
    if (playerIds.length === 0) return [];

    return knexDb("cross_tables_head_to_head")
      .select("*")
      .where(function(this: any) {
        // Games where both player1 and player2 are in the player set
        this.whereIn("player1_id", playerIds).whereIn("player2_id", playerIds);
      })
      .orderBy("date", "desc")
      .orderBy("game_id", "desc");
  }

  /**
   * Get head-to-head record between two specific players
   */
  async getHeadToHeadRecord(player1Id: number, player2Id: number): Promise<Domain.HeadToHeadRecord> {
    const games = await knexDb("cross_tables_head_to_head")
      .select("*")
      .where(function(this: any) {
        this.where({ player1_id: player1Id, player2_id: player2Id })
            .orWhere({ player1_id: player2Id, player2_id: player1Id });
      })
      .orderBy("date", "desc")
      .orderBy("game_id", "desc");

    // Convert database rows to domain HeadToHeadGame objects
    const domainGames: Domain.HeadToHeadGame[] = games.map((row: any) => ({
      gameid: row.game_id,
      date: row.date || "",
      player1: {
        playerid: row.player1_id,
        name: row.player1_name || "",
        score: row.player1_score || 0,
        oldrating: row.player1_old_rating || 0,
        newrating: row.player1_new_rating || 0,
        position: row.player1_position || undefined,
      },
      player2: {
        playerid: row.player2_id,
        name: row.player2_name || "",
        score: row.player2_score || 0,
        oldrating: row.player2_old_rating || 0,
        newrating: row.player2_new_rating || 0,
        position: row.player2_position || undefined,
      },
      annotated: row.annotated || undefined,
    }));

    // Calculate stats - handle ties properly
    let player1Wins = 0;
    let player2Wins = 0;
    let ties = 0;
    
    games.forEach((g: any) => {
      if (g.player1_id === player1Id) {
        if (g.player1_score > g.player2_score) {
          player1Wins++;
        } else if (g.player1_score < g.player2_score) {
          player2Wins++;
        } else {
          ties++;
        }
      } else {
        // player1Id is in player2 position
        if (g.player2_score > g.player1_score) {
          player1Wins++;
        } else if (g.player2_score < g.player1_score) {
          player2Wins++;
        } else {
          ties++;
        }
      }
    });

    return {
      player1Id,
      player2Id,
      games: domainGames,
      player1Wins,
      player2Wins,
      ties,
      totalGames: games.length,
      lastMeeting: domainGames[0], // Most recent game (already sorted by date desc)
    };
  }

  /**
   * Get count of stored head-to-head games for monitoring
   */
  async getGameCount(): Promise<number> {
    const result = await knexDb("cross_tables_head_to_head").count("id as count").first();
    return parseInt(result?.count as string || "0");
  }

  /**
   * Clean up old head-to-head data (optional maintenance)
   */
  async deleteOldGames(olderThanDays: number = 365): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deleted = await knexDb("cross_tables_head_to_head")
      .where("date", "<", cutoffDate.toISOString().split('T')[0])
      .del();

    console.log(`🗑️ Deleted ${deleted} head-to-head games older than ${olderThanDays} days`);
  }
}