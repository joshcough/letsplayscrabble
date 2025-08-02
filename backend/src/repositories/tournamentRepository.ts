import * as DB from "@shared/types/database";
// Import the shared types
import { GameChanges, TournamentUpdate } from "@shared/types/database";
import { Knex } from "knex";

import { knexDb } from "../config/database";

export class TournamentRepository {
  async create(
    createTournament: DB.CreateTournament,
  ): Promise<DB.TournamentRow> {
    return knexDb.transaction(async (trx) => {
      // Insert tournament record
      const [tournament] = await trx("tournaments")
        .insert(createTournament.tournament)
        .returning("*");

      // Store data in normalized tables (first time = no incremental logic needed)
      await this.storeTournamentDataIncremental(
        trx,
        tournament.id,
        createTournament,
      );

      return tournament;
    });
  }

  async findAllForUser(userId: number): Promise<Array<DB.TournamentRow>> {
    return knexDb("tournaments")
      .select("*")
      .where("user_id", userId)
      .orderBy("name", "asc");
  }

  async findByIdForUser(
    id: number,
    userId: number,
  ): Promise<DB.TournamentRow | null> {
    return knexDb("tournaments")
      .select("*")
      .where("id", id)
      .where("user_id", userId)
      .first();
  }

  async updateData(
    id: number,
    createTournament: DB.CreateTournament,
  ): Promise<DB.TournamentUpdate> {
    return knexDb.transaction(async (trx) => {
      // Update tournament record
      const [updated] = await trx("tournaments")
        .where("id", id)
        .update({
          data: createTournament.tournament.data,
        })
        .returning("*");

      if (!updated) {
        throw new Error(`Tournament ${id} not found`);
      }

      // Update normalized tables with incremental approach
      const changes = await this.storeTournamentDataIncremental(
        trx,
        id,
        createTournament,
      );

      return { tournament: updated, changes };
    });
  }

  async updateTournamentWithNewData(
    id: number,
    userId: number,
    metadata: DB.TournamentMetadata,
    createTournament: DB.CreateTournament,
  ): Promise<DB.TournamentUpdate> {
    return knexDb.transaction(async (trx) => {
      // Update tournament metadata AND data in single transaction
      const [updated] = await trx("tournaments")
        .where("id", id)
        .where("user_id", userId)
        .update({
          name: metadata.name,
          city: metadata.city,
          year: metadata.year,
          lexicon: metadata.lexicon,
          long_form_name: metadata.longFormName,
          data_url: metadata.dataUrl,
          data: createTournament.tournament.data,
        })
        .returning("*");

      if (!updated) {
        throw new Error("Tournament not found or access denied");
      }

      // Update normalized tables with incremental approach
      const changes = await this.storeTournamentDataIncremental(
        trx,
        id,
        createTournament,
      );

      return { tournament: updated, changes };
    });
  }

  async updateTournamentMetadata(
    id: number,
    userId: number,
    metadata: DB.TournamentMetadata,
  ): Promise<DB.TournamentRow> {
    const [updated] = await knexDb("tournaments")
      .where("id", id)
      .where("user_id", userId)
      .update({
        name: metadata.name,
        city: metadata.city,
        year: metadata.year,
        lexicon: metadata.lexicon,
        long_form_name: metadata.longFormName,
        data_url: metadata.dataUrl,
      })
      .returning("*");

    if (!updated) {
      throw new Error("Tournament not found or access denied");
    }

    return updated;
  }

  async getTournamentAsTree(
    tournamentId: number,
    userId: number,
    divisionId?: number,
  ): Promise<DB.Tournament | null> {
    console.log("🔍 getTournamentAsTree:", {
      tournamentId,
      userId,
      divisionId,
    });

    // First verify ownership and get tournament
    const tournament = await this.findByIdForUser(tournamentId, userId);
    if (!tournament) {
      console.log("❌ Tournament not found or access denied");
      return null;
    }

    // Get divisions (all or filtered)
    let divisions: DB.DivisionRow[];
    if (divisionId !== undefined) {
      const division = await knexDb("divisions")
        .select("*")
        .where("tournament_id", tournamentId)
        .where("id", divisionId)
        .first();

      if (!division) {
        console.log("❌ Division not found");
        return null;
      }
      divisions = [division];
    } else {
      divisions = await knexDb("divisions")
        .select("*")
        .where("tournament_id", tournamentId)
        .orderBy("position");
    }

    console.log(
      "📊 Found divisions:",
      divisions.map((d) => ({ id: d.id, name: d.name })),
    );

    const hierarchicalDivisions = await Promise.all(
      divisions.map(async (division) => {
        // Get players for this division
        const players = await knexDb("players")
          .select("*")
          .where("tournament_id", tournamentId)
          .where("division_id", division.id)
          .orderBy("seed");

        // Get games for this division
        const games = await knexDb("games")
          .select("*")
          .where("division_id", division.id)
          .orderBy(["round_number", "pairing_id"]);

        console.log(`📊 Division ${division.name}:`, {
          players: players.length,
          games: games.length,
        });

        return {
          division,
          players,
          games,
        };
      }),
    );

    return {
      tournament,
      divisions: hierarchicalDivisions,
    };
  }

  async isOwner(id: number, userId: number): Promise<boolean> {
    const tournament = await knexDb("tournaments")
      .select("id")
      .where("id", id)
      .where("user_id", userId)
      .first();
    return !!tournament;
  }

  async deleteByIdForUser(id: number, userId: number): Promise<void> {
    return knexDb.transaction(async (trx) => {
      // First verify the tournament belongs to the user
      const tournament = await trx("tournaments")
        .select("id")
        .where("id", id)
        .where("user_id", userId)
        .first();

      if (!tournament) {
        throw new Error("Tournament not found or access denied");
      }

      // Delete in reverse order due to foreign key constraints
      await trx("games")
        .whereIn(
          "division_id",
          trx("divisions").select("id").where("tournament_id", id),
        )
        .del();

      await trx("players").where("tournament_id", id).del();
      await trx("divisions").where("tournament_id", id).del();

      await trx("current_matches")
        .where("tournament_id", id)
        .where("user_id", userId)
        .del();

      await trx("tournaments").where("id", id).where("user_id", userId).del();
    });
  }

  // Polling methods - keep these as they're used for tournament updates
  async updatePollUntil(
    id: number,
    pollUntil: Date | null,
  ): Promise<DB.TournamentRow> {
    const [updated] = await knexDb("tournaments")
      .where("id", id)
      .update({ poll_until: pollUntil })
      .returning("*");
    return updated;
  }

  async findActivePollable(): Promise<DB.TournamentRow[]> {
    return knexDb("tournaments")
      .select("*")
      .whereNotNull("poll_until")
      .where("poll_until", ">", knexDb.fn.now());
  }

  async endInactivePollable(): Promise<void> {
    await knexDb("tournaments")
      .whereNotNull("poll_until")
      .where("poll_until", "<=", knexDb.fn.now())
      .update({ poll_until: null });
  }

  async stopPolling(id: number): Promise<void> {
    await knexDb("tournaments").where("id", id).update({ poll_until: null });
  }

  // PRIVATE: Internal methods for data storage

  private async storeTournamentDataIncremental(
    trx: Knex.Transaction,
    tournamentId: number,
    data: DB.CreateTournament,
  ): Promise<DB.GameChanges> {
    // Check if divisions exist for this tournament
    const existingDivisions = await trx("divisions")
      .where("tournament_id", tournamentId)
      .select("id");

    let divisionIdMap: Map<number, number>; // position → db_id
    let playerFileIdToDbIdMap: Map<number, number>; // file_id → db_id

    if (existingDivisions.length === 0) {
      // First time loading data - insert divisions and players
      console.log("🆕 First data load - inserting divisions and players");

      // Insert divisions
      divisionIdMap = new Map<number, number>();
      for (let i = 0; i < data.divisions.length; i++) {
        const divisionData = data.divisions[i];
        const [division] = await trx("divisions")
          .insert({
            tournament_id: tournamentId,
            ...divisionData,
          })
          .returning("*");
        divisionIdMap.set(i, division.id);
      }

      // Insert players
      playerFileIdToDbIdMap = new Map<number, number>();
      for (const playerData of data.players) {
        const divisionId = divisionIdMap.get(playerData.division_position);
        if (!divisionId) continue;

        const [player] = await trx("players")
          .insert({
            tournament_id: tournamentId,
            division_id: divisionId,
            seed: playerData.seed,
            name: playerData.name,
            initial_rating: playerData.initial_rating,
            photo: playerData.photo,
            etc_data: JSON.stringify(playerData.etc_data),
          })
          .returning("*");

        playerFileIdToDbIdMap.set(playerData.seed, player.id);
      }
    } else {
      // Subsequent loads - get existing mappings
      console.log(
        "🔄 Incremental data load - using existing divisions and players",
      );

      // Get division mappings
      const divisions = await trx("divisions")
        .where("tournament_id", tournamentId)
        .select("id", "position")
        .orderBy("position");

      divisionIdMap = new Map<number, number>();
      divisions.forEach((div) => divisionIdMap.set(div.position, div.id));

      // Get player mappings
      const players = await trx("players")
        .where("tournament_id", tournamentId)
        .select("id", "seed");

      playerFileIdToDbIdMap = new Map<number, number>();
      players.forEach((player) =>
        playerFileIdToDbIdMap.set(player.seed, player.id),
      );
    }

    // Always upsert games with change detection
    const changes: DB.GameChanges = { added: [], updated: [] };

    for (const gameData of data.games) {
      const divisionId = divisionIdMap.get(gameData.division_position);
      const player1DbId = playerFileIdToDbIdMap.get(gameData.player1_file_id);
      const player2DbId = playerFileIdToDbIdMap.get(gameData.player2_file_id);

      if (!divisionId || !player1DbId || !player2DbId) {
        console.warn("⚠️ Skipping game - missing division or player IDs", {
          divisionId,
          player1DbId,
          player2DbId,
          gameData,
        });
        continue;
      }

      try {
        const result = await trx.raw(
          `
          INSERT INTO games (
            division_id, round_number, player1_id, player2_id,
            player1_score, player2_score, is_bye, pairing_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (division_id, round_number, pairing_id)
          DO UPDATE SET
            player1_score = EXCLUDED.player1_score,
            player2_score = EXCLUDED.player2_score,
            is_bye = EXCLUDED.is_bye,
            updated_at = NOW()
          WHERE
            games.player1_score IS DISTINCT FROM EXCLUDED.player1_score OR
            games.player2_score IS DISTINCT FROM EXCLUDED.player2_score OR
            games.is_bye IS DISTINCT FROM EXCLUDED.is_bye
          RETURNING
            id,
            CASE
              WHEN xmax = 0 THEN 'INSERTED'
              ELSE 'UPDATED'
            END as action
        `,
          [
            divisionId,
            gameData.round_number,
            player1DbId,
            player2DbId,
            gameData.player1_score ?? null,
            gameData.player2_score ?? null,
            gameData.is_bye ?? false,
            gameData.pairing_id,
          ],
        );

        if (result.rows.length > 0) {
          const { action } = result.rows[0];
          if (action === "INSERTED") {
            changes.added.push(gameData);
            console.log(
              `➕ ADDED: Div${gameData.division_position} R${gameData.round_number} P${gameData.player1_file_id}vsP${gameData.player2_file_id} (${gameData.player1_score ?? "null"}/${gameData.player2_score ?? "null"}) Pairing:${gameData.pairing_id}`,
            );
          } else if (action === "UPDATED") {
            changes.updated.push(gameData);
            console.log(
              `🔄 UPDATED: Div${gameData.division_position} R${gameData.round_number} P${gameData.player1_file_id}vsP${gameData.player2_file_id} (${gameData.player1_score ?? "null"}/${gameData.player2_score ?? "null"}) Pairing:${gameData.pairing_id}`,
            );
          }
        }
      } catch (error) {
        console.error("❌ Error upserting game:", error, gameData);
        throw error;
      }
    }

    console.log("📊 Game changes:", {
      added: changes.added.length,
      updated: changes.updated.length,
    });

    return changes;
  }

  private async clearTournamentData(
    trx: Knex.Transaction,
    tournamentId: number,
  ): Promise<void> {
    // Delete in reverse order due to foreign key constraints
    await trx("games")
      .whereIn(
        "division_id",
        trx("divisions").select("id").where("tournament_id", tournamentId),
      )
      .del();

    await trx("players").where("tournament_id", tournamentId).del();
    await trx("divisions").where("tournament_id", tournamentId).del();
  }

  async getDivisions(
    tournamentId: number,
    userId: number,
  ): Promise<Array<DB.DivisionRow>> {
    return knexDb("divisions")
      .select("divisions.*")
      .join("tournaments", "divisions.tournament_id", "tournaments.id")
      .where("divisions.tournament_id", tournamentId)
      .where("tournaments.user_id", userId)
      .orderBy("divisions.name", "asc");
  }

  async getPlayersForDivision(
    tournamentId: number,
    userId: number,
    divisionName: string,
  ): Promise<Array<DB.PlayerRow>> {
    return knexDb("players")
      .select("players.*")
      .join("divisions", "players.division_id", "divisions.id")
      .join("tournaments", "divisions.tournament_id", "tournaments.id")
      .where("divisions.tournament_id", tournamentId)
      .where("tournaments.user_id", userId)
      .where("divisions.name", divisionName)
      .orderBy("players.seed", "asc");
  }
}
