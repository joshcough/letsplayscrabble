import * as DB from "@shared/types/database";
import { knexDb } from "../config/database";
import { Knex } from "knex";

export class TournamentRepository {
  async create(
    createTournament: DB.CreateTournament,
  ): Promise<DB.TournamentRow> {
    return knexDb.transaction(async (trx) => {
      // Insert tournament record
      const [tournament] = await trx("tournaments")
        .insert(createTournament.tournament)
        .returning("*");

      // Store data in normalized tables
      await this.storeTournamentData(trx, tournament.id, createTournament);

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
  ): Promise<DB.TournamentRow> {
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

      // Update normalized tables
      await this.storeTournamentData(trx, id, createTournament);

      return updated;
    });
  }

  async updateTournamentWithNewData(
    id: number,
    userId: number,
    metadata: DB.UpdateTournamentMetadata,
    createTournament: DB.CreateTournament,
  ): Promise<DB.TournamentRow> {
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

      // Update normalized tables with new data
      await this.storeTournamentData(trx, id, createTournament);

      return updated;
    });
  }

  async updateTournamentMetadata(
    id: number,
    userId: number,
    metadata: DB.UpdateTournamentMetadata,
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

  // NEW: The main method for getting hierarchical tournament data
  async getHierarchicalTournamentForUser(
    tournamentId: number,
    userId: number,
    divisionId?: number,
  ): Promise<DB.Tournament | null> {
    console.log("🔍 getHierarchicalTournamentForUser:", {
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

    // Build hierarchical structure
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
  private async storeTournamentData(
    trx: Knex.Transaction,
    tournamentId: number,
    data: DB.CreateTournament,
  ): Promise<void> {
    // Clear existing data for this tournament
    await this.clearTournamentData(trx, tournamentId);

    // Insert divisions and collect ID mapping
    const divisionIdMap = new Map<number, number>(); // position → db_id
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

    // Insert players and collect ID mapping
    const playerFileIdToDbIdMap = new Map<number, number>(); // file_id → db_id
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

    // Insert games
    const gameInserts = [];
    for (const gameData of data.games) {
      const divisionId = divisionIdMap.get(gameData.division_position);
      const player1DbId = playerFileIdToDbIdMap.get(gameData.player1_file_id);
      const player2DbId = playerFileIdToDbIdMap.get(gameData.player2_file_id);

      if (!divisionId || !player1DbId || !player2DbId) continue;

      gameInserts.push({
        division_id: divisionId,
        round_number: gameData.round_number,
        player1_id: player1DbId,
        player2_id: player2DbId,
        player1_score: gameData.player1_score,
        player2_score: gameData.player2_score,
        is_bye: gameData.is_bye,
        pairing_id: gameData.pairing_id,
      });
    }

    if (gameInserts.length > 0) {
      await trx("games").insert(gameInserts);
    }
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
