import * as DB from "@shared/types/database";
import { knexDb } from "../config/database";
import { Knex } from "knex";

export class CleanTournamentRepository {

  async create(createTournament: DB.CreateTournament): Promise<DB.TournamentRow> {
    return knexDb.transaction(async (trx) => {
      // Insert tournament record
      const [tournament] = await trx('tournaments')
        .insert(createTournament.tournament)
        .returning('*');

      // Store data in normalized tables
      await this.storeTournamentData(trx, tournament.id, createTournament);

      return tournament;
    });
  }

  async findByIdForUser(id: number, userId: number): Promise<DB.TournamentRow | null> {
    return knexDb('tournaments')
      .select('*')
      .where('id', id)
      .where('user_id', userId)
      .first();
  }

  async updateData(id: number, createTournament: DB.CreateTournament): Promise<DB.TournamentRow> {
    return knexDb.transaction(async (trx) => {
      // Update tournament record
      const [updated] = await trx('tournaments')
        .where('id', id)
        .update({
          data: createTournament.tournament.data,
        })
        .returning('*');

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
    createTournament: DB.CreateTournament
  ): Promise<DB.TournamentRow> {
    return knexDb.transaction(async (trx) => {
      // Update tournament metadata AND data in single transaction
      const [updated] = await trx('tournaments')
        .where('id', id)
        .where('user_id', userId)
        .update({
          name: metadata.name,
          city: metadata.city,
          year: metadata.year,
          lexicon: metadata.lexicon,
          long_form_name: metadata.longFormName,
          data_url: metadata.dataUrl,
          data: createTournament.tournament.data,
        })
        .returning('*');

      if (!updated) {
        throw new Error(`Tournament ${id} not found or access denied`);
      }

      // Update normalized tables with new data
      await this.storeTournamentData(trx, id, createTournament);

      return updated;
    });
  }

  async updateTournamentMetadata(
    id: number,
    userId: number,
    metadata: DB.UpdateTournamentMetadata
  ): Promise<DB.TournamentRow> {
    const [updated] = await knexDb('tournaments')
      .where('id', id)
      .where('user_id', userId)
      .update({
        name: metadata.name,
        city: metadata.city,
        year: metadata.year,
        lexicon: metadata.lexicon,
        long_form_name: metadata.longFormName,
        data_url: metadata.dataUrl,
      })
      .returning('*');

    if (!updated) {
      throw new Error(`Tournament ${id} not found or access denied`);
    }

    return updated;
  }

  private async storeTournamentData(trx: Knex.Transaction, tournamentId: number, data: DB.CreateTournament): Promise<void> {
    // Clear existing data for this tournament
    await this.clearTournamentData(trx, tournamentId);

    // Insert divisions and collect ID mapping
    const divisionIdMap = new Map<number, number>(); // position → db_id
    for (let i = 0; i < data.divisions.length; i++) {
      const divisionData = data.divisions[i];
      const [division] = await trx('divisions')
        .insert({
          tournament_id: tournamentId,
          ...divisionData,
        })
        .returning('*');
      divisionIdMap.set(i, division.id);
    }

    // Insert players and collect ID mapping
    const playerFileIdToDbIdMap = new Map<number, number>(); // file_id → db_id
    for (const playerData of data.players) {
      const divisionId = divisionIdMap.get(playerData.division_position);
      if (!divisionId) continue;

      const [player] = await trx('tournament_players')
        .insert({
          tournament_id: tournamentId,
          division_id: divisionId,
          player_id: playerData.player_id,
          name: playerData.name,
          initial_rating: playerData.initial_rating,
          photo: playerData.photo,
          etc_data: JSON.stringify(playerData.etc_data),
        })
        .returning('*');

      playerFileIdToDbIdMap.set(playerData.player_id, player.id);
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
      await trx('games').insert(gameInserts);
    }
  }

  private async clearTournamentData(trx: Knex.Transaction, tournamentId: number): Promise<void> {
    // Delete in reverse order due to foreign key constraints
    await trx('games')
      .whereIn('division_id',
        trx('divisions').select('id').where('tournament_id', tournamentId)
      )
      .del();

    await trx('tournament_players').where('tournament_id', tournamentId).del();
    await trx('divisions').where('tournament_id', tournamentId).del();
  }
}