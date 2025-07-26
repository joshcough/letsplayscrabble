import {
  Tournament,
  ProcessedTournament,
  TournamentData,
  TwoPlayerStats,
  DivisionStats,
} from "@shared/types/tournament";
import { CurrentMatch } from "@shared/types/currentMatch";
import { MatchWithPlayers } from "@shared/types/admin";
import { TournamentStatsService } from "../services/tournamentStatsService";
import { calculateStatsFromGames, formatName } from "../services/statsCalculations";
import { knexDb } from "../config/database";

export class TournamentRepository {
  private statsService: TournamentStatsService;

  constructor() {
    this.statsService = new TournamentStatsService(knexDb);
  }

  async findById(id: number): Promise<ProcessedTournament | null> {
    const tournament = await knexDb('tournaments')
      .select('*')
      .where('id', id)
      .first();

    if (!tournament) {
      return null;
    }

    // Get all divisions and players in a single query
    const divisionsWithPlayers = await knexDb('divisions as d')
      .leftJoin('tournament_players as tp', 'd.id', 'tp.division_id')
      .select(
        'd.id as division_id',
        'd.name as division_name',
        'd.position as division_position',
        'tp.id as player_db_id',           // ← Database ID
        'tp.player_id as player_file_id',  // ← File ID
        'tp.player_id as player_id',
        'tp.name as player_name',
        'tp.initial_rating as rating',
        'tp.photo',
        'tp.etc_data as etc'
      )
      .where('d.tournament_id', id)
      .orderBy(['d.position', 'tp.player_id']);

    // Group results by division
    const divisionsMap = new Map();

    for (const row of divisionsWithPlayers) {
      if (!divisionsMap.has(row.division_id)) {
        divisionsMap.set(row.division_id, {
          name: row.division_name,
          players: []
        });
      }

      // Only add player if they exist (leftJoin might return null players)
      if (row.player_id) {
        divisionsMap.get(row.division_id).players.push({
          id: row.player_db_id,
          name: row.player_name,
          rating: row.rating,
          photo: row.photo,
          etc: row.etc,
        });
      }
    }

    // Convert map to array in correct order
    const divisionsData = Array.from(divisionsMap.values());

    // Calculate standings using divisions data we already have
    const standings = await this.statsService.calculateStandingsWithData(id, divisionsWithPlayers);

    // Calculate pairings from tables
    const divisionPairings = await this.calculatePairingsFromTables(id);

    return {
      ...tournament,
      divisions: divisionsData,
      standings,
      divisionPairings,
    };
  }

  // User-scoped methods
  async findByIdForUser(id: number, userId: number): Promise<ProcessedTournament | null> {
    const tournament = await knexDb('tournaments')
      .select('*')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!tournament) {
      return null;
    }

    return await this.findById(id);
  }

  async findByNameForUser(name: string, userId: number): Promise<ProcessedTournament | null> {
    const tournament = await knexDb('tournaments')
      .select('*')
      .where('name', name)
      .where('user_id', userId)
      .first();

    return tournament ? await this.findById(tournament.id) : null;
  }

  async findAllNamesForUser(userId: number): Promise<Array<{ id: number; name: string }>> {
    return knexDb('tournaments')
      .select('id', 'name')
      .where('user_id', userId)
      .orderBy('name', 'asc');
  }

  async findAllForUser(userId: number): Promise<ProcessedTournament[]> {
    const tournaments = await knexDb('tournaments')
      .select('*')
      .where('user_id', userId);

    const processed = await Promise.all(
      tournaments.map(async (t) => await this.findById(t.id))
    );
    return processed.filter((t): t is ProcessedTournament => t !== null);
  }

  // Global methods (all users) - keep for admin/public access
  async findByName(name: string): Promise<ProcessedTournament | null> {
    const tournament = await knexDb('tournaments')
      .select('*')
      .where('name', name)
      .first();

    return tournament ? await this.findById(tournament.id) : null;
  }

  async findAllNames(): Promise<Array<{ id: number; name: string; user_id: number }>> {
    return knexDb('tournaments')
      .select('id', 'name', 'user_id')
      .orderBy('name', 'asc');
  }

  async findAll(): Promise<ProcessedTournament[]> {
    const tournaments = await knexDb('tournaments').select('*');
    const processed = await Promise.all(
      tournaments.map(async (t) => await this.findById(t.id))
    );
    return processed.filter((t): t is ProcessedTournament => t !== null);
  }

  private async calculatePairingsFromTables(tournamentId: number) {
    // Get all data in a single query - NO ROUNDS JOIN!
    const allPairings = await knexDb('divisions as d')
      .join('games as g', 'd.id', 'g.division_id')  // Direct join now!
      .join('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .join('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'd.position as division_position',
        'd.name as division_name',
        'g.round_number',          // Direct field now!
        'g.pairing_id',
        'tp1.player_id as p1_file_id', 'tp1.name as p1_name', 'tp1.etc_data as p1_etc',
        'tp2.player_id as p2_file_id', 'tp2.name as p2_name', 'tp2.etc_data as p2_etc'
      )
      .where('d.tournament_id', tournamentId)
      .where('g.is_bye', false)
      .orderBy(['d.position', 'g.round_number', 'g.pairing_id']);

    // Group by division and round
    const divisionMap = new Map();

    for (const row of allPairings) {
      if (!divisionMap.has(row.division_position)) {
        divisionMap.set(row.division_position, new Map());
      }

      const roundMap = divisionMap.get(row.division_position);
      if (!roundMap.has(row.round_number)) {
        roundMap.set(row.round_number, {
          round: row.round_number,
          divisionName: row.division_name,
          pairings: []
        });
      }

      roundMap.get(row.round_number).pairings.push({
        round: row.round_number,
        player1: {
          id: row.p1_file_id,
          name: row.p1_name,
          firstLast: formatName(row.p1_name),
          etc: row.p1_etc,
        },
        player2: {
          id: row.p2_file_id,
          name: row.p2_name,
          firstLast: formatName(row.p2_name),
          etc: row.p2_etc,
        },
      });
    }

    // Convert to expected format - ensure we have an array with proper indexing
    const divisionPairings: any[] = [];
    for (const [divisionPos, roundMap] of divisionMap) {
      const rounds = Array.from(roundMap.values());
      divisionPairings[divisionPos] = rounds;
    }

    return divisionPairings;
  }

  async findTwoPlayerStats(
    tournamentId: number,
    divisionIndex: number,
    player1Id: number,
    player2Id: number,
  ): Promise<TwoPlayerStats> {
    const tournament = await this.findById(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    const standings = tournament.standings[divisionIndex];
    if (!standings) {
      throw new Error(
        `Division ${divisionIndex} not found in tournament ${tournamentId}`,
      );
    }

    // Find players by their file player ID
    const player1 = standings.find(p => p.id === player1Id);
    const player2 = standings.find(p => p.id === player2Id);

    if (!player1 || !player2) {
      throw new Error("One or both players not found");
    }

    return {
      tournament: {
        name: tournament.name,
        lexicon: tournament.lexicon,
      },
      player1,
      player2,
    };
  }

  async updatePollUntil(id: number, pollUntil: Date | null): Promise<Tournament> {
    const [updated] = await knexDb('tournaments')
      .where('id', id)
      .update({ poll_until: pollUntil })
      .returning('*');
    return updated;
  }

  // Critical: Include user_id in polling results
  async findActivePollable(): Promise<(Tournament & { user_id: number })[]> {
    return knexDb('tournaments')
      .select('*', 'user_id')
      .whereNotNull('poll_until')
      .where('poll_until', '>', knexDb.fn.now());
  }

  async endInactivePollable(): Promise<void> {
    await knexDb('tournaments')
      .whereNotNull('poll_until')
      .where('poll_until', '<=', knexDb.fn.now())
      .update({ poll_until: null });
  }

  async stopPolling(id: number): Promise<void> {
    await knexDb('tournaments')
      .where('id', id)
      .update({ poll_until: null });
  }

  async getMatchWithPlayers(match: CurrentMatch): Promise<MatchWithPlayers> {
    const tournament = await this.findById(match.tournament_id);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Get the pairing details from table-based pairings
    const divisionPairings = tournament.divisionPairings[match.division_id];
    if (!divisionPairings) {
      throw new Error(`Division ${match.division_id} pairings not found`);
    }

    const roundPairings = divisionPairings.find(
      (rp: any) => rp.round === match.round,
    );
    if (!roundPairings) {
      throw new Error(`Round ${match.round} not found`);
    }

    const pairing = roundPairings.pairings[match.pairing_id];
    if (!pairing) {
      throw new Error(`Pairing ${match.pairing_id} not found`);
    }

    // Get recent games using table-based method
    const divisionDbId = await knexDb('divisions')
      .select('id')
      .where('tournament_id', match.tournament_id)
      .where('position', match.division_id)
      .first();

    if (!divisionDbId) {
      throw new Error(`Division database ID not found`);
    }

    const player1Last5 = await this.statsService.getPlayerRecentGames(
      match.tournament_id,
      divisionDbId.id,
      pairing.player1.id
    );
    const player2Last5 = await this.statsService.getPlayerRecentGames(
      match.tournament_id,
      divisionDbId.id,
      pairing.player2.id
    );

    // Get player stats using the player IDs from the pairing
    const playerStats = await this.findTwoPlayerStats(
      match.tournament_id,
      match.division_id,
      pairing.player1.id,
      pairing.player2.id,
    );

    return {
      matchData: match,
      tournament: playerStats.tournament,
      players: [playerStats.player1, playerStats.player2],
      last5: [player1Last5, player2Last5],
    };
  }

  async deleteByIdForUser(id: number, userId: number): Promise<void> {
    return knexDb.transaction(async (trx) => {
      // First verify the tournament belongs to the user
      const tournament = await trx('tournaments')
        .select('id')
        .where('id', id)
        .where('user_id', userId)
        .first();

      if (!tournament) {
        throw new Error('Tournament not found or access denied');
      }

      // Delete in reverse order due to foreign key constraints
      // Much simpler deletion - no rounds table!
      await trx('games')
        .whereIn('division_id',
          trx('divisions').select('id').where('tournament_id', id)
        )
        .del();

      await trx('tournament_players').where('tournament_id', id).del();
      await trx('divisions').where('tournament_id', id).del();

      await trx('current_matches')
        .where('tournament_id', id)
        .where('user_id', userId)
        .del();

      await trx('tournaments').where('id', id).where('user_id', userId).del();
    });
  }

  async getDivisionStats(tournamentId: number, divisionId: number): Promise<DivisionStats> {
    const games = await this.getGameDataForStats(tournamentId, divisionId);
    return calculateStatsFromGames(games);
  }

  async getTournamentStats(tournamentId: number): Promise<DivisionStats> {
    const games = await this.getGameDataForStats(tournamentId); // No divisionId = all divisions
    return calculateStatsFromGames(games);
  }

  private async getGameDataForStats(tournamentId: number, divisionId?: number) {
    // Simplified query - no rounds join needed
    let query = knexDb('divisions as d')
      .join('games as g', 'd.id', 'g.division_id')  // Direct join!
      .join('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .join('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'g.player1_score',
        'g.player2_score',
        'tp1.player_id as player1_file_id',
        'tp2.player_id as player2_file_id',
        'tp1.etc_data as player1_etc',
        'g.round_number'          // Direct field!
      )
      .where('d.tournament_id', tournamentId)
      .where('g.is_bye', false)
      .whereNotNull('g.player1_score')
      .whereNotNull('g.player2_score');

    // Add division filter if specified
    if (divisionId !== undefined) {
      query = query.where('d.position', divisionId);
    }

    return query;
  }
}