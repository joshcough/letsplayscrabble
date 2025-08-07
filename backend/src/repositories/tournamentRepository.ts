import * as DB from "@shared/types/database";
import * as Domain from "@shared/types/domain";
import { GameChanges, TournamentUpdate } from "@shared/types/database";
import { Knex } from "knex";

// Internal type for repository use - uses seeds before conversion to DB IDs
type GameWithSeeds = {
  division_id: number;
  round_number: number;
  player1_seed: number;
  player2_seed: number;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
  pairing_id: number | null;
};

import { knexDb } from "../config/database";
import { convertFileToDatabase } from "../services/fileToDatabaseConversions";
import { debugPrintCreateTournament } from "../utils/debugHelpers";
import { transformToDomainTournament } from "../utils/domainTransforms";

export class TournamentRepository {
  async create(
    createTournament: DB.CreateTournament,
  ): Promise<DB.TournamentRow> {
    debugPrintCreateTournament(createTournament);

    return knexDb.transaction(async (trx) => {
      // Insert tournament record (metadata only)
      const [tournament] = await trx("tournaments")
        .insert({
          name: createTournament.tournament.name,
          city: createTournament.tournament.city,
          year: createTournament.tournament.year,
          lexicon: createTournament.tournament.lexicon,
          long_form_name: createTournament.tournament.long_form_name,
          user_id: createTournament.tournament.user_id,
        })
        .returning("*");

      // Insert tournament data record
      await trx("tournament_data").insert({
        tournament_id: tournament.id,
        data_url: createTournament.tournament.data_url,
        data: createTournament.tournament.data,
        poll_until: createTournament.tournament.poll_until,
      });

      // Store data in normalized tables
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
      .select(
        "tournaments.*",
        "tournament_data.data_url",
        "tournament_data.poll_until",
      )
      .join(
        "tournament_data",
        "tournaments.id",
        "tournament_data.tournament_id",
      )
      .where("tournaments.user_id", userId)
      .orderBy("tournaments.name", "asc");
  }

  async findByIdForUser(
    id: number,
    userId: number,
  ): Promise<DB.TournamentRow | null> {
    return knexDb("tournaments")
      .select(
        "tournaments.*",
        "tournament_data.data_url",
        "tournament_data.poll_until",
      )
      .join(
        "tournament_data",
        "tournaments.id",
        "tournament_data.tournament_id",
      )
      .where("tournaments.id", id)
      .where("tournaments.user_id", userId)
      .first();
  }

  // Get tournaments that need polling with their data
  async findActivePollableWithData(): Promise<
    Array<{
      tournament: DB.TournamentRow;
      tournamentData: DB.TournamentDataRow;
    }>
  > {
    const results = await knexDb("tournaments")
      .select(
        "tournaments.*",
        "tournament_data.tournament_id",
        "tournament_data.data_url",
        "tournament_data.data",
        "tournament_data.poll_until",
        "tournament_data.created_at as data_created_at",
        "tournament_data.updated_at as data_updated_at",
      )
      .join(
        "tournament_data",
        "tournaments.id",
        "tournament_data.tournament_id",
      )
      .whereNotNull("tournament_data.poll_until")
      .where("tournament_data.poll_until", ">", knexDb.fn.now());

    return results.map((row) => ({
      tournament: {
        id: row.id,
        name: row.name,
        city: row.city,
        year: row.year,
        lexicon: row.lexicon,
        long_form_name: row.long_form_name,
        data_url: row.data_url,
        poll_until: row.poll_until,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_id: row.user_id,
      },
      tournamentData: {
        tournament_id: row.tournament_id,
        data_url: row.data_url,
        data: row.data,
        poll_until: row.poll_until,
        created_at: row.data_created_at,
        updated_at: row.data_updated_at,
      },
    }));
  }

  // Get tournament data for a specific tournament
  async getTournamentData(
    tournamentId: number,
  ): Promise<DB.TournamentDataRow | null> {
    return knexDb("tournament_data")
      .select("*")
      .where("tournament_id", tournamentId)
      .first();
  }

  // Update tournament data (replaces the old updateData method)
  async updateTournamentData(
    tournamentId: number,
    dataUrl: string,
    newData: any,
  ): Promise<DB.TournamentUpdate> {
    return knexDb.transaction(async (trx) => {
      // Update the tournament_data table
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

      // Get the tournament record
      const tournament = await trx("tournaments")
        .select("*")
        .where("id", tournamentId)
        .first();

      if (!tournament) {
        throw new Error(`Tournament ${tournamentId} not found`);
      }

      // Convert file data to database format for incremental updates
      const createTournamentData = convertFileToDatabase(
        newData,
        {
          name: tournament.name,
          city: tournament.city,
          year: tournament.year,
          lexicon: tournament.lexicon,
          longFormName: tournament.long_form_name,
          dataUrl: dataUrl,
        },
        tournament.user_id,
      );

      // Apply incremental changes to normalized tables
      const changes = await this.storeTournamentDataIncremental(
        trx,
        tournamentId,
        createTournamentData,
      );

      return { tournament, changes };
    });
  }

  async updateTournamentWithNewData(
    id: number,
    userId: number,
    metadata: DB.TournamentMetadata,
    createTournament: DB.CreateTournament,
  ): Promise<DB.TournamentUpdate> {
    return knexDb.transaction(async (trx) => {
      // Update tournament metadata
      const [updated] = await trx("tournaments")
        .where("id", id)
        .where("user_id", userId)
        .update({
          name: metadata.name,
          city: metadata.city,
          year: metadata.year,
          lexicon: metadata.lexicon,
          long_form_name: metadata.longFormName,
        })
        .returning("*");

      if (!updated) {
        throw new Error("Tournament not found or access denied");
      }

      // Update tournament data
      await trx("tournament_data").where("tournament_id", id).update({
        data_url: metadata.dataUrl,
        data: createTournament.tournament.data,
        updated_at: knexDb.fn.now(),
      });

      // Apply incremental changes to normalized tables
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
    return knexDb.transaction(async (trx) => {
      // Update tournament metadata
      const [updated] = await trx("tournaments")
        .where("id", id)
        .where("user_id", userId)
        .update({
          name: metadata.name,
          city: metadata.city,
          year: metadata.year,
          lexicon: metadata.lexicon,
          long_form_name: metadata.longFormName,
        })
        .returning("*");

      if (!updated) {
        throw new Error("Tournament not found or access denied");
      }

      // Update data_url in tournament_data table if provided
      if (metadata.dataUrl !== undefined) {
        await trx("tournament_data").where("tournament_id", id).update({
          data_url: metadata.dataUrl,
          updated_at: knexDb.fn.now(),
        });
      }

      return updated;
    });
  }

  async getTournamentAsTree(
    tournamentId: number,
    userId: number,
    divisionId?: number,
  ): Promise<DB.Tournament | null> {
    const tournament = await this.findByIdForUser(tournamentId, userId);
    if (!tournament) {
      console.log("❌ Tournament not found or access denied");
      return null;
    }

    const divisions = await this.getDivisionRows(tournamentId, divisionId);
    if (!divisions.length) {
      console.log("❌ Division not found");
      return null;
    }

    const hierarchicalDivisions = await this.makeDivisionTree(
      tournamentId,
      divisions,
    );

    return { tournament, divisions: hierarchicalDivisions };
  }

  async getTournamentAsDomainModel(
    tournamentId: number,
    userId: number,
    divisionId?: number,
  ): Promise<Domain.Tournament | null> {
    const flatTournament = await this.getTournamentAsTree(tournamentId, userId, divisionId);
    if (!flatTournament) {
      return null;
    }

    return transformToDomainTournament(flatTournament);
  }

  async isOwner(id: number, userId: number): Promise<boolean> {
    const tournament = await knexDb("tournaments")
      .select("tournaments.id")
      .where("tournaments.id", id)
      .where("tournaments.user_id", userId)
      .first();
    return !!tournament;
  }

  async deleteByIdForUser(id: number, userId: number): Promise<void> {
    return knexDb.transaction(async (trx) => {
      await this.verifyTournamentOwnership(trx, id, userId);
      await this.deleteTournamentCascade(trx, id, userId);
    });
  }

  // Polling methods - now work with tournament_data table
  async updatePollUntil(
    tournamentId: number,
    pollUntil: Date | null,
  ): Promise<DB.TournamentDataRow> {
    const [updated] = await knexDb("tournament_data")
      .where("tournament_id", tournamentId)
      .update({ poll_until: pollUntil })
      .returning("*");

    if (!updated) {
      throw new Error(`Tournament data ${tournamentId} not found`);
    }

    return updated;
  }

  async endInactivePollable(): Promise<void> {
    await knexDb("tournament_data")
      .whereNotNull("poll_until")
      .where("poll_until", "<=", knexDb.fn.now())
      .update({ poll_until: null });
  }

  async stopPolling(tournamentId: number): Promise<void> {
    await knexDb("tournament_data")
      .where("tournament_id", tournamentId)
      .update({ poll_until: null });
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

  async getTournamentDataFileContents(
    tournamentId: number,
    userId: number,
  ): Promise<any> {
    const result = await knexDb("tournament_data")
      .select("tournament_data.data")
      .join("tournaments", "tournament_data.tournament_id", "tournaments.id")
      .where("tournament_data.tournament_id", tournamentId)
      .where("tournaments.user_id", userId)
      .first();

    return result?.data || null;
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

  // PRIVATE HELPER METHODS

  private async getDivisionRows(
    tournamentId: number,
    divisionId?: number,
  ): Promise<DB.DivisionRow[]> {
    if (divisionId !== undefined) {
      const division = await knexDb("divisions")
        .select("*")
        .where("tournament_id", tournamentId)
        .where("id", divisionId)
        .first();
      return division ? [division] : [];
    }

    return knexDb("divisions")
      .select("*")
      .where("tournament_id", tournamentId)
      .orderBy("position");
  }

  private async makeDivisionTree(
    tournamentId: number,
    divisions: DB.DivisionRow[],
  ): Promise<
    Array<{
      division: DB.DivisionRow;
      players: DB.PlayerRow[];
      games: DB.GameRow[];
    }>
  > {
    return Promise.all(
      divisions.map(async (division) => {
        const [players, games] = await Promise.all([
          this.getPlayersForDivisionId(tournamentId, division.id),
          this.getGamesForDivision(division.id),
        ]);
        return { division, players, games };
      }),
    );
  }

  private async getPlayersForDivisionId(
    tournamentId: number,
    divisionId: number,
  ): Promise<DB.PlayerRow[]> {
    return knexDb("players")
      .select("*")
      .where("tournament_id", tournamentId)
      .where("division_id", divisionId)
      .orderBy("seed");
  }

  private async getGamesForDivision(divisionId: number): Promise<DB.GameRow[]> {
    return knexDb("games")
      .select("*")
      .where("division_id", divisionId)
      .orderBy(["round_number", "pairing_id"]);
  }

  private async verifyTournamentOwnership(
    trx: Knex.Transaction,
    id: number,
    userId: number,
  ): Promise<void> {
    const tournament = await trx("tournaments")
      .select("tournaments.id")
      .where("tournaments.id", id)
      .where("tournaments.user_id", userId)
      .first();

    if (!tournament) {
      throw new Error("Tournament not found or access denied");
    }
  }

  private async deleteTournamentCascade(
    trx: Knex.Transaction,
    id: number,
    userId: number,
  ): Promise<void> {
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

    // Delete tournament data first (foreign key)
    await trx("tournament_data").where("tournament_id", id).del();

    // Then delete tournament
    await trx("tournaments")
      .where("tournaments.id", id)
      .where("tournaments.user_id", userId)
      .del();
  }

  private async storeTournamentDataIncremental(
    trx: Knex.Transaction,
    tournamentId: number,
    data: DB.CreateTournament,
  ): Promise<DB.GameChanges> {
    const existingDivisions = await trx("divisions")
      .where("tournament_id", tournamentId)
      .select("id");

    const isFirstLoad = existingDivisions.length === 0;

    if (isFirstLoad) {
      console.log("🆕 First data load - inserting divisions and players");
      return this.handleFirstDataLoad(trx, tournamentId, data);
    } else {
      console.log(
        "🔄 Incremental data load - using existing divisions and players",
      );
      return this.handleIncrementalDataLoad(trx, tournamentId, data);
    }
  }

  private async handleFirstDataLoad(
    trx: Knex.Transaction,
    tournamentId: number,
    data: DB.CreateTournament,
  ): Promise<DB.GameChanges> {
    const allChanges: DB.GameChanges = { added: [], updated: [] };

    // Process each division with its players and games
    for (const divisionData of data.divisions) {
      const divisionId = await this.insertDivision(
        trx,
        tournamentId,
        {
          tournament_id: tournamentId,
          name: divisionData.division.name,
          position: divisionData.division.position,
        },
      );

      const playerSeedToDbIdMap = await this.insertPlayersForDivision(
        trx,
        tournamentId,
        divisionId,
        divisionData.players.map(p => ({
          tournament_id: tournamentId,
          division_id: divisionId,
          seed: p.seed,
          name: p.name,
          initial_rating: p.initial_rating,
          photo: p.photo,
          etc_data: p.etc_data,
        })),
      );

      const changes = await this.upsertGamesForDivision(
        trx,
        divisionId,
        divisionData.games.map(g => ({
          division_id: divisionId,
          round_number: g.round_number,
          player1_seed: g.player1_seed,
          player2_seed: g.player2_seed,
          player1_score: g.player1_score,
          player2_score: g.player2_score,
          is_bye: g.is_bye,
          pairing_id: g.pairing_id,
        })),
        playerSeedToDbIdMap,
      );

      allChanges.added.push(...changes.added);
      allChanges.updated.push(...changes.updated);
    }

    return allChanges;
  }

  private async handleIncrementalDataLoad(
    trx: Knex.Transaction,
    tournamentId: number,
    data: DB.CreateTournament,
  ): Promise<DB.GameChanges> {
    const allChanges: DB.GameChanges = { added: [], updated: [] };

    // Get existing divisions mapped by position
    const existingDivisions = await trx("divisions")
      .where("tournament_id", tournamentId)
      .select("id", "position")
      .orderBy("position");

    const divisionsByPosition = new Map(
      existingDivisions.map((d) => [d.position, d.id]),
    );

    // Process each division's games
    for (const divisionData of data.divisions) {
      const divisionId = divisionsByPosition.get(
        divisionData.division.position,
      );

      if (!divisionId) {
        console.warn(
          `⚠️ Division at position ${divisionData.division.position} not found`,
        );
        continue;
      }

      // Get existing player mappings for this division
      const playerSeedToDbIdMap = await this.getPlayerMappingsForDivision(
        trx,
        tournamentId,
        divisionId,
      );

      const changes = await this.upsertGamesForDivision(
        trx,
        divisionId,
        divisionData.games.map(g => ({
          division_id: divisionId,
          round_number: g.round_number,
          player1_seed: g.player1_seed,
          player2_seed: g.player2_seed,
          player1_score: g.player1_score,
          player2_score: g.player2_score,
          is_bye: g.is_bye,
          pairing_id: g.pairing_id,
        })),
        playerSeedToDbIdMap,
      );

      allChanges.added.push(...changes.added);
      allChanges.updated.push(...changes.updated);
    }

    return allChanges;
  }

  private async insertDivision(
    trx: Knex.Transaction,
    tournamentId: number,
    division: DB.CreateDivisionRow,
  ): Promise<number> {
    const [inserted] = await trx("divisions")
      .insert({
        tournament_id: tournamentId,
        name: division.name,
        position: division.position,
      })
      .returning("id");

    return inserted.id;
  }

  private async insertPlayersForDivision(
    trx: Knex.Transaction,
    tournamentId: number,
    divisionId: number,
    players: DB.CreatePlayerRow[],
  ): Promise<Map<number, number>> {
    const playerSeedToDbIdMap = new Map<number, number>();

    for (const playerData of players) {
      const [player] = await trx("players")
        .insert({
          tournament_id: tournamentId,
          division_id: divisionId,
          seed: playerData.seed,
          name: playerData.name,
          initial_rating: playerData.initial_rating,
          photo: playerData.photo,
          etc_data: playerData.etc_data,
        })
        .returning("*");

      playerSeedToDbIdMap.set(playerData.seed, player.id);
    }

    return playerSeedToDbIdMap;
  }

  private async getPlayerMappingsForDivision(
    trx: Knex.Transaction,
    tournamentId: number,
    divisionId: number,
  ): Promise<Map<number, number>> {
    const players = await trx("players")
      .where("tournament_id", tournamentId)
      .where("division_id", divisionId)
      .select("id", "seed");

    const playerSeedToDbIdMap = new Map<number, number>();
    players.forEach((p) => playerSeedToDbIdMap.set(p.seed, p.id));
    return playerSeedToDbIdMap;
  }

  private async upsertGamesForDivision(
    trx: Knex.Transaction,
    divisionId: number,
    games: GameWithSeeds[],
    playerSeedToDbIdMap: Map<number, number>,
  ): Promise<DB.GameChanges> {
    const changes: DB.GameChanges = { added: [], updated: [] };

    for (const gameData of games) {
      const gameResult = await this.upsertSingleGame(
        trx,
        divisionId,
        gameData,
        playerSeedToDbIdMap,
      );

      if (gameResult) {
        changes[gameResult.action].push(gameResult.game);
      }
    }

    return changes;
  }

  private async upsertSingleGame(
    trx: Knex.Transaction,
    divisionId: number,
    gameData: GameWithSeeds,
    playerSeedToDbIdMap: Map<number, number>,
  ): Promise<{ action: "added" | "updated"; game: DB.GameRow } | null> {
    const player1DbId = playerSeedToDbIdMap.get(gameData.player1_seed);
    const player2DbId = playerSeedToDbIdMap.get(gameData.player2_seed);

    if (!player1DbId || !player2DbId) {
      console.warn("⚠️ Skipping game - missing player IDs", {
        divisionId,
        gameData,
        availableSeeds: Array.from(playerSeedToDbIdMap.keys()),
      });
      return null;
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
        const [gameRow] = await trx("games")
          .where({
            division_id: divisionId,
            round_number: gameData.round_number,
            pairing_id: gameData.pairing_id,
          })
          .select("*");

        if (gameRow) {
          const actionType = action === "INSERTED" ? "added" : "updated";
          const scoreDisplay =
            gameData.player1_score !== null && gameData.player2_score !== null
              ? `${gameData.player1_score}-${gameData.player2_score}`
              : "no scores yet";
          console.log(
            `${action === "INSERTED" ? "➕ ADDED" : "🔄 UPDATED"} game: Division ${divisionId}, Round ${gameData.round_number} - Seed${gameData.player1_seed} vs Seed${gameData.player2_seed} (${scoreDisplay})`,
          );
          return { action: actionType, game: gameRow };
        }
      }
    } catch (error) {
      console.error("❌ Error upserting game:", error, gameData);
      throw error;
    }

    return null;
  }
}
