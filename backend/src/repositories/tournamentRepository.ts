// backend/src/repositories/tournamentRepository.ts (optimized version)
import { Pool } from "pg";
import {
  Tournament,
  ProcessedTournament,
  TournamentData,
  CreateTournamentParams,
  TwoPlayerStats,
  DivisionStats,
} from "@shared/types/tournament";
import { CurrentMatch } from "@shared/types/currentMatch";
import { MatchWithPlayers } from "@shared/types/admin";
import { loadTournamentFile } from "../services/dataProcessing";
import { TournamentDataService } from "../services/tournamentDataService";
import { TournamentStatsService } from "../services/tournamentStatsService";
import { knexDb } from "../config/database";

export class TournamentRepository {
  private dataService: TournamentDataService;
  private statsService: TournamentStatsService;

  constructor(private readonly db: Pool) {
    this.dataService = new TournamentDataService(knexDb);
    this.statsService = new TournamentStatsService(knexDb);
  }

  async create({
    name,
    city,
    year,
    lexicon,
    longFormName,
    dataUrl,
    rawData,
  }: CreateTournamentParams): Promise<ProcessedTournament> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Insert tournament record
      const result = await client.query<Tournament>(
        `INSERT INTO tournaments (
          name, city, year, lexicon, long_form_name, data_url, data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [name, city, year, lexicon, longFormName, dataUrl, rawData],
      );

      const tournament = result.rows[0];

      // Store data in normalized tables
      await this.dataService.storeTournamentData(tournament.id, rawData);

      await client.query('COMMIT');

      // Return processed tournament using table-based method
      return await this.findById(tournament.id) as ProcessedTournament;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: number): Promise<ProcessedTournament | null> {
    const result = await this.db.query<Tournament>(
      "SELECT * FROM tournaments WHERE id = $1",
      [id],
    );

    if (!result.rows[0]) {
      return null;
    }

    const tournament = result.rows[0];

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
//           scores: [], // Empty for now
//           pairings: [], // Empty for now
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

  private async calculatePairingsFromTables(tournamentId: number) {
    // Get all data in a single query
    const allPairings = await knexDb('divisions as d')
      .join('rounds as r', 'd.id', 'r.division_id')
      .join('games as g', 'r.id', 'g.round_id')
      .join('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .join('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'd.position as division_position',
        'd.name as division_name',
        'r.round_number',
        'g.pairing_id',
        'tp1.player_id as p1_file_id', 'tp1.name as p1_name', 'tp1.etc_data as p1_etc',
        'tp2.player_id as p2_file_id', 'tp2.name as p2_name', 'tp2.etc_data as p2_etc'
      )
      .where('d.tournament_id', tournamentId)
      .where('g.is_bye', false)
      .orderBy(['d.position', 'r.round_number', 'g.pairing_id']);

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
          firstLast: this.formatName(row.p1_name),
          etc: row.p1_etc,
        },
        player2: {
          id: row.p2_file_id,
          name: row.p2_name,
          firstLast: this.formatName(row.p2_name),
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

  private formatName(name: string): string {
    if (!name || !name.includes(",")) return name || "Unknown Player";

    const [last, first] = name.split(", ");
    if (!first || !last) return name;

    return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
  }

  async findByName(name: string): Promise<ProcessedTournament | null> {
    const result = await this.db.query<Tournament>(
      "SELECT * FROM tournaments WHERE name = $1",
      [name],
    );
    return result.rows[0] ? await this.findById(result.rows[0].id) : null;
  }

  async findAllNames(): Promise<Array<{ id: number; name: string }>> {
    const result = await this.db.query<{ id: number; name: string }>(
      "SELECT id, name FROM tournaments ORDER BY name ASC",
    );
    return result.rows;
  }

  async findAll(): Promise<ProcessedTournament[]> {
    const result = await this.db.query<Tournament>("SELECT * FROM tournaments");
    const processed = await Promise.all(
      result.rows.map(async (t) => await this.findById(t.id))
    );
    return processed.filter((t): t is ProcessedTournament => t !== null);
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

  async updatePollUntil(
    id: number,
    pollUntil: Date | null,
  ): Promise<Tournament> {
    const result = await this.db.query<Tournament>(
      "UPDATE tournaments SET poll_until = $1 WHERE id = $2 RETURNING *",
      [pollUntil, id],
    );
    return result.rows[0];
  }

  async findActivePollable(): Promise<Tournament[]> {
    const result = await this.db.query<Tournament>(`
      SELECT *
      FROM tournaments
      WHERE poll_until IS NOT NULL
      AND poll_until > NOW()
    `);
    return result.rows;
  }

  async endInactivePollable(): Promise<void> {
    await this.db.query(`
      UPDATE tournaments
      SET poll_until = NULL
      WHERE poll_until IS NOT NULL
      AND poll_until <= NOW()
    `);
  }

  async updateData(
    id: number,
    newData: TournamentData,
  ): Promise<ProcessedTournament> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Update tournament record
      const result = await client.query<Tournament>(
        `UPDATE tournaments
         SET data = $1
         WHERE id = $2
         RETURNING *`,
        [newData, id],
      );

      if (!result.rows[0]) {
        throw new Error(`Tournament ${id} not found`);
      }

      // Update normalized tables
      await this.dataService.updateTournamentData(id, newData);

      await client.query('COMMIT');

      // Return updated tournament using table-based method
      return await this.findById(id) as ProcessedTournament;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async stopPolling(id: number): Promise<void> {
    await this.db.query(
      `UPDATE tournaments SET poll_until = NULL WHERE id = $1`,
      [id],
    );
  }

  // Helper method for initial tournament creation
  async createFromUrl(
    params: Omit<CreateTournamentParams, "rawData">,
  ): Promise<ProcessedTournament> {
    const rawData = await loadTournamentFile(params.dataUrl);
    return this.create({ ...params, rawData });
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

  async update(
    id: number,
    {
      name,
      city,
      year,
      lexicon,
      longFormName,
      dataUrl,
    }: {
      name: string;
      city: string;
      year: number;
      lexicon: string;
      longFormName: string;
      dataUrl: string;
    },
  ): Promise<ProcessedTournament> {
    const newData = await loadTournamentFile(dataUrl);

    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query<Tournament>(
        `UPDATE tournaments
         SET name = $1,
             city = $2,
             year = $3,
             lexicon = $4,
             long_form_name = $5,
             data_url = $6,
             data = $7
         WHERE id = $8
         RETURNING *`,
        [name, city, year, lexicon, longFormName, dataUrl, newData, id],
      );

      if (!result.rows[0]) {
        throw new Error(`Tournament ${id} not found`);
      }

      // Update normalized tables
      await this.dataService.updateTournamentData(id, newData);

      await client.query('COMMIT');

      return await this.findById(id) as ProcessedTournament;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDivisionStats(tournamentId: number, divisionId: number): Promise<DivisionStats> {
    const games = await this.getGameDataForStats(tournamentId, divisionId);
    return this.calculateStatsFromGames(games);
  }

  async getTournamentStats(tournamentId: number): Promise<DivisionStats> {
    const games = await this.getGameDataForStats(tournamentId); // No divisionId = all divisions
    return this.calculateStatsFromGames(games);
  }

  private async getGameDataForStats(tournamentId: number, divisionId?: number) {
    let query = knexDb('divisions as d')
      .join('rounds as r', 'd.id', 'r.division_id')
      .join('games as g', 'r.id', 'g.round_id')
      .join('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .join('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'g.player1_score',
        'g.player2_score',
        'tp1.player_id as player1_file_id',
        'tp2.player_id as player2_file_id',
        'tp1.etc_data as player1_etc',
        'r.round_number'
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

  private calculateStatsFromGames(games: any[]): DivisionStats {
    let totalGamesPlayed = games.length;
    let totalPoints = 0;
    let winningScores: number[] = [];
    let losingScores: number[] = [];
    let higherSeedWins = 0;
    let player1Wins = 0;

    for (const game of games) {
      const score1 = game.player1_score;
      const score2 = game.player2_score;

      totalPoints += score1 + score2;

      if (score1 > score2) {
        winningScores.push(score1);
        losingScores.push(score2);
      } else if (score2 > score1) {
        winningScores.push(score2);
        losingScores.push(score1);
      }

      // Calculate higher seed wins (lower file ID = higher seed)
      const higherSeedPlayer = game.player1_file_id < game.player2_file_id ? 1 : 2;
      const winner = score1 > score2 ? 1 : (score2 > score1 ? 2 : 0);
      if (winner === higherSeedPlayer) {
        higherSeedWins++;
      }

      // Calculate going first wins
      const player1Etc = game.player1_etc;
      if (player1Etc?.p12?.[game.round_number - 1] === 1 && score1 > score2) {
        player1Wins++;
      } else if (player1Etc?.p12?.[game.round_number - 1] === 2 && score2 > score1) {
        player1Wins++;
      }
    }

    const averageScore = totalPoints > 0 ? totalPoints / (totalGamesPlayed * 2) : 0;
    const averageWinningScore = winningScores.length > 0
      ? winningScores.reduce((sum, score) => sum + score, 0) / winningScores.length
      : 0;
    const averageLosingScore = losingScores.length > 0
      ? losingScores.reduce((sum, score) => sum + score, 0) / losingScores.length
      : 0;
    const higherSeedWinPercentage = totalGamesPlayed > 0
      ? (higherSeedWins / totalGamesPlayed) * 100
      : 0;
    const goingFirstWinPercentage = totalGamesPlayed > 0
      ? (player1Wins / totalGamesPlayed) * 100
      : 0;

    return {
      gamesPlayed: totalGamesPlayed,
      pointsScored: totalPoints,
      averageScore: Math.round(averageScore * 100) / 100,
      averageWinningScore: Math.round(averageWinningScore),
      averageLosingScore: Math.round(averageLosingScore),
      higherSeedWinPercentage: Math.round(higherSeedWinPercentage * 10) / 10,
      goingFirstWinPercentage: Math.round(goingFirstWinPercentage * 10) / 10,
    };
  }
}