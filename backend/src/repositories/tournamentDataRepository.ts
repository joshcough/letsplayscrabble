import { knexDb } from "../config/database";
import * as DB from "../types/database";
import * as File from "../types/scrabbleFileFormat";

export class TournamentDataRepository {
  // Get tournament data by tournament ID
  async getTournamentData(
    tournamentId: number,
  ): Promise<DB.TournamentDataRow | undefined> {
    return knexDb("tournament_data")
      .where("tournament_id", tournamentId)
      .first();
  }

  // Update tournament data and save new version to versions table
  async updateTournamentData(
    tournamentId: number,
    dataUrl: string,
    newData: File.TournamentData,
  ): Promise<DB.TournamentDataRow> {
    return knexDb.transaction(async (trx) => {
      // Save the NEW data to versions table (so it contains all versions including current)
      await trx("tournament_data_versions").insert({
        tournament_id: tournamentId,
        data: newData,
        created_at: knexDb.fn.now(),
      });

      // Update the tournament_data table with new data
      const [updatedTournamentData] = await trx("tournament_data")
        .where("tournament_id", tournamentId)
        .update({
          data_url: dataUrl,
          data: newData,
          updated_at: knexDb.fn.now(),
        })
        .returning("*");

      if (!updatedTournamentData) {
        throw new Error(`Tournament data ${tournamentId} not found`);
      }

      return updatedTournamentData;
    });
  }

  // Get all versions for a tournament, ordered by creation time (newest first)
  async getTournamentDataVersions(
    tournamentId: number,
  ): Promise<DB.TournamentDataVersionRow[]> {
    return knexDb("tournament_data_versions")
      .select("*")
      .where("tournament_id", tournamentId)
      .orderBy("created_at", "desc");
  }

  // Get a specific version by ID
  async getTournamentDataVersionById(
    versionId: number,
  ): Promise<DB.TournamentDataVersionRow | undefined> {
    return knexDb("tournament_data_versions")
      .select("*")
      .where("id", versionId)
      .first();
  }

  // Get version count and total size for a tournament
  async getTournamentVersionStats(
    tournamentId: number,
  ): Promise<{ count: number; totalBytes: number }> {
    const result = await knexDb("tournament_data_versions")
      .where("tournament_id", tournamentId)
      .count("* as count")
      .sum(knexDb.raw("length(data::text)") as any)
      .first();

    return {
      count: parseInt(result?.count as string) || 0,
      totalBytes: parseInt(result?.sum as string) || 0,
    };
  }
}
