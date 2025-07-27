import * as DB from "@shared/types/database";
import * as Stats from "@shared/types/stats";
import { calculatePlayerDisplayDataWithRank } from "../services/statsCalculations";
import { knexDb } from "../config/database";
import { Knex } from "knex";
import { calculateStatsFromGames } from "../services/statsCalculations";
import { DivisionStats } from "@shared/types/stats";

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

  async findAllForUser(userId: number): Promise<Array<DB.TournamentRow>> {
    return knexDb('tournaments')
      .select('*')
      .where('user_id', userId)
      .orderBy('name', 'asc');
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

      const [player] = await trx('players')
        .insert({
          tournament_id: tournamentId,
          division_id: divisionId,
          seed: playerData.seed,
          name: playerData.name,
          initial_rating: playerData.initial_rating,
          photo: playerData.photo,
          etc_data: JSON.stringify(playerData.etc_data),
        })
        .returning('*');

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
      await trx('games').insert(gameInserts);
    }
  }

  async isOwner(id: number, userId: number): Promise<boolean> {
      const tournament = await knexDb('tournaments')
        .select('id')
        .where('id', id)
        .where('user_id', userId)
        .first();
      return !!tournament;
    }

  private async clearTournamentData(trx: Knex.Transaction, tournamentId: number): Promise<void> {
    // Delete in reverse order due to foreign key constraints
    await trx('games')
      .whereIn('division_id',
        trx('divisions').select('id').where('tournament_id', tournamentId)
      )
      .del();

    await trx('players').where('tournament_id', tournamentId).del();
    await trx('divisions').where('tournament_id', tournamentId).del();
  }

  async getCompleteTournamentForUser(id: number, userId: number): Promise<DB.Tournament | null> {
    const tournament = await this.findByIdForUser(id, userId);
    if (!tournament) return null;

    const [divisions, players, games] = await Promise.all([
      this.getDivisions(id),
      this.getPlayers(id),
      this.getGames(id),
    ]);

    return {
      tournament,
      divisions,
      players,
      games,
    };
  }

  async getDivisions(tournamentId: number): Promise<DB.DivisionRow[]> {
    return knexDb('divisions')
      .select('*')
      .where('tournament_id', tournamentId)
      .orderBy('name');
  }

  async getPlayers(tournamentId: number): Promise<DB.PlayerRow[]> {
    return knexDb('players')
      .select('*')
      .where('tournament_id', tournamentId)
      .orderBy(['division_id', 'player_id']);
  }

  async getGames(tournamentId: number): Promise<DB.GameRow[]> {
    return knexDb('games as g')
      .join('divisions as d', 'g.division_id', 'd.id')
      .select('g.*')
      .where('d.tournament_id', tournamentId)
      .orderBy(['g.division_id', 'g.round_number', 'g.pairing_id']);
  }

  async getPlayerDisplayData(tournamentId: number, divisionId: number, playerId: number, userId: number): Promise<Stats.PlayerDisplayData> {
    // 1. Verify tournament ownership
    const tournament = await this.findByIdForUser(tournamentId, userId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // 2. Get the target player
    const player: DB.PlayerRow = await knexDb('players')
      .select('*')
      .where('tournament_id', tournamentId)
      .where('division_id', divisionId)
      .where('id', playerId)
      .first();

    if (!player) {
      throw new Error("Player not found");
    }

    // 3. Get all players in division
    const allPlayers: DB.PlayerRow[] = await knexDb('players')
      .select('*')
      .where('tournament_id', tournamentId)
      .where('division_id', divisionId);

    // 4. Get all games for this division
    const allGames: DB.GameRow[] = await knexDb('games')
      .select('*')
      .where('division_id', divisionId);

    // 5. Calculate everything using pure functions
    return calculatePlayerDisplayDataWithRank(player, allGames, allPlayers);
  }

  async getDivisionStats(tournamentId: number, divisionId: number): Promise<DivisionStats> {
    const gamesWithPlayers = await this.getGamesWithPlayersForStats(tournamentId, divisionId);
    return calculateStatsFromGames(gamesWithPlayers, divisionId);
  }

  async getTournamentStats(tournamentId: number): Promise<DivisionStats> {
    const gamesWithPlayers = await this.getGamesWithPlayersForStats(tournamentId);
    return calculateStatsFromGames(gamesWithPlayers, 0); // Pass 0 for tournament-wide
  }

  private async getGamesWithPlayersForStats(tournamentId: number, divisionId?: number): Promise<DB.GameWithPlayers[]> {
    // Get games query
    let gamesQuery = knexDb('games as g')
      .join('divisions as d', 'g.division_id', 'd.id')
      .select('g.*')
      .where('d.tournament_id', tournamentId)
      .where('g.is_bye', false)
      .whereNotNull('g.player1_score')
      .whereNotNull('g.player2_score');

    // Add division filter if specified
    if (divisionId !== undefined) {
      gamesQuery = gamesQuery.where('d.position', divisionId);
    }

    const games = await gamesQuery;

    // Get all players involved
    const playerIds = new Set<number>();
    games.forEach(game => {
      playerIds.add(game.player1_id);
      playerIds.add(game.player2_id);
    });

    const players = await knexDb('players')
      .select('*')
      .whereIn('id', Array.from(playerIds));

    const playerMap = new Map(players.map(p => [p.id, p]));

    // Combine games with players
    return games.map(game => {
      const player1 = playerMap.get(game.player1_id)!;
      const player2 = playerMap.get(game.player2_id)!;

      return {
        game,
        player1,
        player2,
        player1_score: game.player1_score,
        player2_score: game.player2_score,
        is_bye: game.is_bye
      };
    });
  }
}