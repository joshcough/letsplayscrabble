import {
  Tournament,
  ProcessedTournament,
  TournamentData,
  CreateTournamentParams,
  TwoPlayerStats,
  DivisionStats,
  Division,
  RawPlayer,
} from "@shared/types/tournament";
import { CurrentMatch } from "@shared/types/currentMatch";
import { MatchWithPlayers } from "@shared/types/admin";
import { loadTournamentFile } from "../services/dataProcessing";
import { TournamentStatsService } from "../services/tournamentStatsService";
import { knexDb } from "../config/database";
import { Knex } from "knex";

export class TournamentRepository {
  private statsService: TournamentStatsService;

  constructor() {
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
    userId,
  }: CreateTournamentParams & { userId: number }): Promise<ProcessedTournament> {
    return knexDb.transaction(async (trx) => {
      // Insert tournament record with user_id
      const [tournament] = await trx('tournaments')
        .insert({
          name,
          city,
          year,
          lexicon,
          long_form_name: longFormName,
          data_url: dataUrl,
          data: rawData,
          user_id: userId,
        })
        .returning('*');

      // Store data in normalized tables
      await this.storeTournamentData(trx, tournament.id, rawData);

      return tournament;
    }).then(tournament => this.findById(tournament.id) as Promise<ProcessedTournament>);
  }

  private async storeTournamentData(trx: Knex.Transaction, tournamentId: number, data: TournamentData): Promise<void> {
    // Clear existing data for this tournament
    await this.clearTournamentData(trx, tournamentId);

    // Insert divisions and their data
    for (let divisionIndex = 0; divisionIndex < data.divisions.length; divisionIndex++) {
      const division = data.divisions[divisionIndex];
      await this.insertDivisionData(trx, tournamentId, division, divisionIndex);
    }
  }

  private async clearTournamentData(trx: Knex.Transaction, tournamentId: number): Promise<void> {
    // Delete in reverse order due to foreign key constraints
    await trx('games')
      .whereIn('round_id',
        trx('rounds')
          .select('id')
          .whereIn('division_id',
            trx('divisions').select('id').where('tournament_id', tournamentId)
          )
      )
      .del();

    await trx('rounds')
      .whereIn('division_id',
        trx('divisions').select('id').where('tournament_id', tournamentId)
      )
      .del();

    await trx('tournament_players').where('tournament_id', tournamentId).del();
    await trx('divisions').where('tournament_id', tournamentId).del();
  }

  private async insertDivisionData(
    trx: Knex.Transaction,
    tournamentId: number,
    division: Division,
    position: number
  ): Promise<void> {
    // Insert division
    const [divisionRecord] = await trx('divisions')
      .insert({
        tournament_id: tournamentId,
        name: division.name,
        position: position
      })
      .returning('id');

    const divisionId = divisionRecord.id;

    // Insert players
    const playerIdMap = new Map<number, number>(); // file player ID -> db player ID

    for (const player of division.players) {
      if (!player) continue;

      const [playerRecord] = await trx('tournament_players')
        .insert({
          tournament_id: tournamentId,
          division_id: divisionId,
          player_id: player.id,
          name: player.name,
          initial_rating: player.rating,
          photo: player.photo,
          etc_data: JSON.stringify(player.etc)
        })
        .returning('id');

      playerIdMap.set(player.id, playerRecord.id);
    }

    // Insert rounds and games
    await this.insertRoundsAndGames(trx, divisionId, division, playerIdMap);
  }

  private async insertRoundsAndGames(
    trx: Knex.Transaction,
    divisionId: number,
    division: Division,
    playerIdMap: Map<number, number>
  ): Promise<void> {
    console.log(`\n=== DEBUG: insertRoundsAndGames for divisionId ${divisionId} ===`);
    console.log(`Total players in division: ${division.players.length}`);

    // Debug each player
    division.players.forEach((player, index) => {
      console.log(`Player ${index}:`, {
        isNull: player === null,
        isUndefined: player === undefined,
        id: player?.id,
        name: player?.name,
        hasPairings: !!player?.pairings,
        pairingsLength: player?.pairings?.length,
        hasScores: !!player?.scores,
        scoresLength: player?.scores?.length,
        hasEtc: !!player?.etc,
        playerKeys: player ? Object.keys(player) : 'N/A'
      });

      if (player && !player.pairings) {
        console.log(`❌ PROBLEM PLAYER FOUND:`, JSON.stringify(player, null, 2));
      }
    });

    // Determine the number of rounds from player data
    const validPlayers = division.players.filter(p => p !== null && p !== undefined && p.pairings);

    console.log(`Valid players with pairings: ${validPlayers.length}/${division.players.length}`);

    if (validPlayers.length === 0) {
      console.log('❌ ERROR: No valid players found with pairings data');
      throw new Error('No valid players found with pairings data');
    }

    const pairingsLengths = validPlayers.map(p => p!.pairings.length);
    console.log(`Pairings lengths:`, pairingsLengths);
    const maxRounds = Math.max(...pairingsLengths);
    console.log(`Max rounds calculated: ${maxRounds}`);

    // Create rounds first
    console.log(`Creating ${maxRounds} rounds...`);
    const roundInserts = [];
    for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
      roundInserts.push({
        division_id: divisionId,
        round_number: roundNum
      });
    }

    const roundRecords = await trx('rounds').insert(roundInserts).returning(['id', 'round_number']);
    console.log(`Created rounds:`, roundRecords);
    const roundIdMap = new Map<number, number>();
    roundRecords.forEach(round => {
      roundIdMap.set(round.round_number, round.id);
    });

    // Track processed pairings to avoid duplicates
    const processedPairings = new Set<string>();
    const gameInserts = [];

    console.log(`\n=== Processing games for ${division.players.length} players ===`);
    // Collect all games first
    for (const player of division.players) {
      if (!player || !player.pairings || !player.scores) {
        console.log(`❌ Skipping invalid player:`, {
          isNull: player === null,
          isUndefined: player === undefined,
          id: player?.id,
          name: player?.name,
          hasPairings: !!player?.pairings,
          hasScores: !!player?.scores,
          fullPlayer: player ? JSON.stringify(player, null, 2) : 'null/undefined'
        });
        continue;
      }

      console.log(`✅ Processing player ${player.id} (${player.name})`);
      const dbPlayerId = playerIdMap.get(player.id);
      if (!dbPlayerId) {
        console.log(`❌ No database ID found for player ${player.id}`);
        continue;
      }

      for (let roundIndex = 0; roundIndex < player.pairings.length; roundIndex++) {
        const roundNum = roundIndex + 1;
        const opponentId = player.pairings[roundIndex];
        const playerScore = player.scores[roundIndex];

        const roundId = roundIdMap.get(roundNum);
        if (!roundId) continue;

        // Handle bye
        if (opponentId === 0) {
          const pairingKey = `${roundNum}-${player.id}-bye`;
          if (!processedPairings.has(pairingKey)) {
            gameInserts.push({
              round_id: roundId,
              player1_id: dbPlayerId,
              player2_id: dbPlayerId,
              player1_score: playerScore,
              player2_score: 0,
              is_bye: true,
              pairing_id: player.id
            });
            processedPairings.add(pairingKey);
          }
          continue;
        }

        // Regular game - avoid duplicate insertion
        const opponent = division.players.find(p => p?.id === opponentId);
        if (!opponent || !opponent.scores) {
          console.log(`Opponent ${opponentId} not found or missing scores`);
          continue;
        }

        const dbOpponentId = playerIdMap.get(opponentId);
        if (!dbOpponentId) continue;

        // Create a consistent pairing key (smaller ID first)
        const pairingKey = `${roundNum}-${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`;

        if (!processedPairings.has(pairingKey)) {
          const opponentScore = opponent.scores[roundIndex];

          // Determine player order based on p12 values
          const isPlayer1First = player.etc?.p12?.[roundIndex] === 1;

          const [player1Id, player2Id, score1, score2] = isPlayer1First
            ? [dbPlayerId, dbOpponentId, playerScore, opponentScore]
            : [dbOpponentId, dbPlayerId, opponentScore, playerScore];

          gameInserts.push({
            round_id: roundId,
            player1_id: player1Id,
            player2_id: player2Id,
            player1_score: score1,
            player2_score: score2,
            is_bye: false,
            pairing_id: Math.min(player.id, opponentId)
          });

          processedPairings.add(pairingKey);
        }
      }
    }

    // Bulk insert all games
    console.log(`\n=== Game insertion summary ===`);
    console.log(`Games to insert: ${gameInserts.length}`);
    if (gameInserts.length > 0) {
      console.log(`Sample game:`, gameInserts[0]);
      await trx('games').insert(gameInserts);
      console.log(`✅ Successfully inserted ${gameInserts.length} games`);
    } else {
      console.log(`⚠️  No games to insert`);
    }
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

  async updateData(id: number, newData: TournamentData): Promise<ProcessedTournament> {
    return knexDb.transaction(async (trx) => {
      // Update tournament record
      const [updated] = await trx('tournaments')
        .where('id', id)
        .update({ data: newData })
        .returning('*');

      if (!updated) {
        throw new Error(`Tournament ${id} not found`);
      }

      // Update normalized tables
      await this.storeTournamentData(trx, id, newData);

      return updated;
    }).then(() => this.findById(id) as Promise<ProcessedTournament>);
  }

  async stopPolling(id: number): Promise<void> {
    await knexDb('tournaments')
      .where('id', id)
      .update({ poll_until: null });
  }

  // Helper method for initial tournament creation
  async createFromUrl(
    params: Omit<CreateTournamentParams, "rawData"> & { userId: number },
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
      // 1. Delete games
      await trx('games')
        .whereIn('round_id',
          trx('rounds')
            .select('id')
            .whereIn('division_id',
              trx('divisions').select('id').where('tournament_id', id)
            )
        )
        .del();

      // 2. Delete rounds
      await trx('rounds')
        .whereIn('division_id',
          trx('divisions').select('id').where('tournament_id', id)
        )
        .del();

      // 3. Delete tournament players
      await trx('tournament_players').where('tournament_id', id).del();

      // 4. Delete divisions
      await trx('divisions').where('tournament_id', id).del();

      // 5. Delete current match if it exists for this tournament
      await trx('current_matches')
        .where('tournament_id', id)
        .where('user_id', userId)
        .del();

      // 6. Finally delete the tournament itself
      await trx('tournaments').where('id', id).where('user_id', userId).del();
    });
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

    return knexDb.transaction(async (trx) => {
      const [updated] = await trx('tournaments')
        .where('id', id)
        .update({
          name,
          city,
          year,
          lexicon,
          long_form_name: longFormName,
          data_url: dataUrl,
          data: newData,
        })
        .returning('*');

      if (!updated) {
        throw new Error(`Tournament ${id} not found`);
      }

      // Update normalized tables
      await this.storeTournamentData(trx, id, newData);

      return updated;
    }).then(() => this.findById(id) as Promise<ProcessedTournament>);
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