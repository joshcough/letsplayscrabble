import { Pool } from "pg";
import {
  Tournament,
  ProcessedTournament,
  TournamentData,
  CreateTournamentParams,
  TwoPlayerStats,
} from "@shared/types/tournament";
import { CurrentMatch } from "@shared/types/currentMatch";
import { MatchWithPlayers } from "@shared/types/admin";
import {
  getPlayerRecentGames,
  loadTournamentFile,
  processTournament,
} from "../services/dataProcessing";

export class TournamentRepository {
  constructor(private readonly db: Pool) {}

  async create({
    name,
    city,
    year,
    lexicon,
    longFormName,
    dataUrl,
    rawData,
  }: CreateTournamentParams): Promise<ProcessedTournament> {
    const result = await this.db.query<Tournament>(
      `INSERT INTO tournaments (
        name, city, year, lexicon, long_form_name, data_url, data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [name, city, year, lexicon, longFormName, dataUrl, rawData],
    );

    const tournament = result.rows[0];
    const processed = processTournament(tournament);
    if (!processed) {
      throw new Error("Failed to process tournament after creation");
    }
    return processed;
  }

  async findById(id: number): Promise<ProcessedTournament | null> {
    const result = await this.db.query<Tournament>(
      "SELECT * FROM tournaments WHERE id = $1",
      [id],
    );
    return result.rows[0] ? processTournament(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<ProcessedTournament | null> {
    const result = await this.db.query<Tournament>(
      "SELECT * FROM tournaments WHERE name = $1",
      [name],
    );
    return result.rows[0] ? processTournament(result.rows[0]) : null;
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
      result.rows.map((t) => processTournament(t)),
    );
    return processed.filter((t): t is ProcessedTournament => t !== null);
  }

  async findTwoPlayerStats(
    tournamentId: number,
    divisionId: number,
    player1Id: number,
    player2Id: number,
  ): Promise<TwoPlayerStats> {
    const tourney = await this.findById(tournamentId);
    if (!tourney) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    const standings = tourney.standings[divisionId];
    if (!standings) {
      throw new Error(
        `Division ${divisionId} not found in tournament ${tournamentId}`,
      );
    }

    return {
      tournament: {
        name: tourney.name,
        lexicon: tourney.lexicon,
      },
      player1: standings[player1Id - 1],
      player2: standings[player2Id - 1],
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
    const result = await this.db.query<Tournament>(
      `UPDATE tournaments
       SET data = $1
       WHERE id = $2
       RETURNING *`,
      [newData, id],
    );

    if (!result.rows[0]) {
      throw new Error(`Tournament ${id} not found`);
    }

    const processed = processTournament(result.rows[0]);
    if (!processed) {
      throw new Error("Failed to process updated tournament data");
    }
    return processed;
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

    // Get the pairing details
    const divisionPairings = tournament.divisionPairings[match.division_id];
    if (!divisionPairings) {
      throw new Error(`Division ${match.division_id} pairings not found`);
    }

    const roundPairings = divisionPairings.find(
      (rp) => rp.round === match.round,
    );
    if (!roundPairings) {
      throw new Error(`Round ${match.round} not found`);
    }

    const pairing = roundPairings.pairings[match.pairing_id];
    if (!pairing) {
      throw new Error(`Pairing ${match.pairing_id} not found`);
    }

    const division = tournament.divisions[match.division_id];
    const player1Last5 = getPlayerRecentGames(division, pairing.player1.id);
    const player2Last5 = getPlayerRecentGames(division, pairing.player2.id);

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
}
