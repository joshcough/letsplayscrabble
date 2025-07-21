// backend/src/services/tournamentStatsService.ts
import { Knex } from "knex";
import { PlayerStats, GameResult } from "@shared/types/tournament";

interface DatabasePlayer {
  id: number;
  player_id: number;
  name: string;
  initial_rating: number;
  photo: string;
  etc_data: any;
}

interface DatabaseGame {
  round_number: number;
  player1_id: number;
  player2_id: number;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
  opponent_name: string;
  opponent_etc: any;
}

export class TournamentStatsService {
  constructor(private readonly knex: Knex) {}

  async calculateStandingsWithData(tournamentId: number, divisionsWithPlayers: any[]): Promise<PlayerStats[][]> {
    // Group divisions and players from the data we already have
    const divisionsMap = new Map();

    for (const row of divisionsWithPlayers) {
      if (!divisionsMap.has(row.division_id)) {
        divisionsMap.set(row.division_id, {
          id: row.division_id,
          name: row.division_name,
          players: []
        });
      }

      if (row.player_id) {
        divisionsMap.get(row.division_id).players.push({
          id: row.player_id, // This is the database ID
          player_id: row.player_id,
          name: row.player_name,
          initial_rating: row.rating,
          photo: row.photo,
          etc_data: row.etc
        });
      }
    }

    const standings: PlayerStats[][] = [];

    // Get ALL games for ALL divisions in a single query
    const allGames = await this.knex('games as g')
      .join('rounds as r', 'g.round_id', 'r.id')
      .join('divisions as d', 'r.division_id', 'd.id')
      .leftJoin('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .leftJoin('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'd.id as division_id',
        'r.round_number',
        'g.player1_id',
        'g.player2_id',
        'g.player1_score',
        'g.player2_score',
        'g.is_bye',
        'tp1.name as p1_name',
        'tp1.etc_data as p1_etc',
        'tp2.name as p2_name',
        'tp2.etc_data as p2_etc'
      )
      .where('d.tournament_id', tournamentId)
      .orderBy('r.round_number');

    // Group games by division and player
    const gamesByDivisionAndPlayer = new Map();

    for (const division of divisionsMap.values()) {
      gamesByDivisionAndPlayer.set(division.id, new Map());
      for (const player of division.players) {
        gamesByDivisionAndPlayer.get(division.id).set(player.id, []);
      }
    }

    // Process all games
    for (const game of allGames) {
      const divisionGames = gamesByDivisionAndPlayer.get(game.division_id);
      if (!divisionGames) continue;

      // Add game for player1 if they're in this division
      if (divisionGames.has(game.player1_id)) {
        divisionGames.get(game.player1_id).push({
          round_number: game.round_number,
          player1_id: game.player1_id,
          player2_id: game.player2_id,
          player1_score: game.player1_score,
          player2_score: game.player2_score,
          is_bye: game.is_bye,
          opponent_name: game.p2_name || '',
          opponent_etc: game.p2_etc
        });
      }

      // Add game for player2 if they're in this division
      if (divisionGames.has(game.player2_id)) {
        divisionGames.get(game.player2_id).push({
          round_number: game.round_number,
          player1_id: game.player2_id, // Flip perspective
          player2_id: game.player1_id,
          player1_score: game.player2_score,
          player2_score: game.player1_score,
          is_bye: game.is_bye,
          opponent_name: game.p1_name || '',
          opponent_etc: game.p1_etc
        });
      }
    }

    // Calculate standings for each division
    for (const division of Array.from(divisionsMap.values()).sort((a, b) => a.id - b.id)) {
      const playerStats: PlayerStats[] = [];
      const divisionGames = gamesByDivisionAndPlayer.get(division.id);

      for (const player of division.players) {
        const playerGames = divisionGames.get(player.id) || [];
        const stats = this.calculatePlayerStatsFromGames(player, playerGames);
        playerStats.push(stats);
      }

      standings.push(this.calculateAllRanks(playerStats));
    }

    return standings;
  }

  private async getDivisions(tournamentId: number) {
    return this.knex('divisions')
      .select('id', 'name')
      .where('tournament_id', tournamentId)
      .orderBy('position');
  }

  private async calculateDivisionStandings(divisionId: number): Promise<PlayerStats[]> {
    // Get all players in the division
    const players: DatabasePlayer[] = await this.knex('tournament_players')
      .select('id', 'player_id', 'name', 'initial_rating', 'photo', 'etc_data')
      .where('division_id', divisionId)
      .orderBy('player_id');

    // Get ALL games for ALL players in the division in one query
    const playerIds = players.map(p => p.id);
    const allGames = await this.knex('games as g')
      .join('rounds as r', 'g.round_id', 'r.id')
      .leftJoin('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .leftJoin('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'r.round_number',
        'g.player1_id',
        'g.player2_id',
        'g.player1_score',
        'g.player2_score',
        'g.is_bye',
        'tp1.name as p1_name',
        'tp1.etc_data as p1_etc',
        'tp2.name as p2_name',
        'tp2.etc_data as p2_etc'
      )
      .where('r.division_id', divisionId)
      .where(function() {
        this.whereIn('g.player1_id', playerIds).orWhereIn('g.player2_id', playerIds);
      })
      .orderBy('r.round_number');

    // Group games by player
    const gamesByPlayer = new Map<number, DatabaseGame[]>();
    players.forEach(player => gamesByPlayer.set(player.id, []));

    for (const game of allGames) {
      // Add game for player1 if they're in our division
      if (playerIds.includes(game.player1_id)) {
        gamesByPlayer.get(game.player1_id)?.push({
          round_number: game.round_number,
          player1_id: game.player1_id,
          player2_id: game.player2_id,
          player1_score: game.player1_score,
          player2_score: game.player2_score,
          is_bye: game.is_bye,
          opponent_name: game.p2_name || '',
          opponent_etc: game.p2_etc
        });
      }

      // Add game for player2 if they're in our division
      if (playerIds.includes(game.player2_id)) {
        gamesByPlayer.get(game.player2_id)?.push({
          round_number: game.round_number,
          player1_id: game.player2_id, // Flip perspective
          player2_id: game.player1_id,
          player1_score: game.player2_score,
          player2_score: game.player1_score,
          is_bye: game.is_bye,
          opponent_name: game.p1_name || '',
          opponent_etc: game.p1_etc
        });
      }
    }

    // Calculate stats for each player using their cached games
    const playerStats: PlayerStats[] = [];
    for (const player of players) {
      const playerGames = gamesByPlayer.get(player.id) || [];
      const stats = this.calculatePlayerStatsFromGames(player, playerGames);
      playerStats.push(stats);
    }

    // Calculate rankings
    return this.calculateAllRanks(playerStats);
  }

  private calculatePlayerStatsFromGames(player: DatabasePlayer, games: DatabaseGame[]): PlayerStats {
    let totalSpread = 0;
    let totalScore = 0;
    let totalOpponentScore = 0;
    let highScore = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let gamesPlayed = 0;

    for (const game of games) {
      if (game.is_bye) {
        // Handle bye
        const byeScore = game.player1_score; // Already flipped for player perspective
        if (byeScore !== null) {
          totalSpread += byeScore;
          if (byeScore > 0) wins += 1;
          else losses += 1;
        }
      } else {
        // Regular game - already from player's perspective
        const playerScore = game.player1_score;
        const opponentScore = game.player2_score;

        if (playerScore !== null && opponentScore !== null) {
          const spread = playerScore - opponentScore;
          totalSpread += spread;

          if (playerScore > opponentScore) wins += 1;
          else if (playerScore < opponentScore) losses += 1;
          else ties += 1;

          totalScore += playerScore;
          totalOpponentScore += opponentScore;
          highScore = Math.max(highScore, playerScore);
          gamesPlayed += 1;
        }
      }
    }

    const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;
    const averageOpponentScore = gamesPlayed > 0 ? (totalOpponentScore / gamesPlayed).toFixed(1) : "0";

    // Calculate current rating and rating diff from etc_data
    let currentRating = 0;
    let ratingDiff = 0;
    const etcData = player.etc_data;

    if (etcData?.newr && Array.isArray(etcData.newr)) {
      currentRating = etcData.newr[etcData.newr.length - 1] ?? 0;
      ratingDiff = currentRating - player.initial_rating;
    }

    return {
      id: player.player_id, // Use the file player ID for compatibility
      name: player.name,
      firstLast: this.formatName(player.name),
      initialRating: player.initial_rating,
      currentRating,
      ratingDiff,
      seed: player.player_id,
      seedOrdinal: this.getOrdinal(player.player_id),
      wins,
      losses,
      ties,
      spread: totalSpread,
      averageScore,
      averageScoreRounded: averageScore.toFixed(1),
      averageOpponentScore,
      highScore,
      averageScoreRank: 0, // Will be calculated in calculateAllRanks
      averageOpponentScoreRank: 0,
      averageScoreRankOrdinal: "0th",
      averageOpponentScoreRankOrdinal: "0th",
      etc: etcData,
      photo: player.photo,
    };
  }

  private calculateAllRanks(players: PlayerStats[]): PlayerStats[] {
    // Calculate win/loss/spread ranks
    const playersByWins = [...players].sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.spread - a.spread;
    });

    // Calculate average score ranks
    const playersByAvgScore = [...players].sort((a, b) => b.averageScore - a.averageScore);

    // Calculate opponent score ranks
    const playersByOpponentScore = [...players].sort((a, b) =>
      parseFloat(a.averageOpponentScore) - parseFloat(b.averageOpponentScore)
    );

    // Create ranking maps
    const rankMap = new Map<number, number>();
    const avgScoreRankMap = new Map<number, number>();
    const avgOpponentScoreRankMap = new Map<number, number>();

    playersByWins.forEach((player, index) => rankMap.set(player.id, index + 1));
    playersByAvgScore.forEach((player, index) => avgScoreRankMap.set(player.id, index + 1));
    playersByOpponentScore.forEach((player, index) => avgOpponentScoreRankMap.set(player.id, index + 1));

    // Apply rankings
    return players.map(player => ({
      ...player,
      rank: rankMap.get(player.id) ?? 0,
      rankOrdinal: this.getOrdinal(rankMap.get(player.id) ?? 0),
      averageScoreRank: avgScoreRankMap.get(player.id) ?? 0,
      averageScoreRankOrdinal: this.getOrdinal(avgScoreRankMap.get(player.id) ?? 0),
      averageOpponentScoreRank: avgOpponentScoreRankMap.get(player.id) ?? 0,
      averageOpponentScoreRankOrdinal: this.getOrdinal(avgOpponentScoreRankMap.get(player.id) ?? 0),
    }));
  }

  // Add the batch method for getting multiple players' recent games
  async getMultiplePlayersRecentGames(
    tournamentId: number,
    divisionId: number,
    playerIds: number[]
  ): Promise<Map<number, GameResult[]>> {
    // Get database IDs for these players
    const playerDbIds = await this.knex('tournament_players')
      .select('id', 'player_id')
      .where('tournament_id', tournamentId)
      .where('division_id', divisionId)
      .whereIn('player_id', playerIds);

    const dbIdToFileIdMap = new Map();
    const dbIds = playerDbIds.map(p => {
      dbIdToFileIdMap.set(p.id, p.player_id);
      return p.id;
    });

    const games = await this.knex('games as g')
      .join('rounds as r', 'g.round_id', 'r.id')
      .leftJoin('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .leftJoin('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'r.round_number',
        'g.player1_id', 'g.player2_id',
        'g.player1_score', 'g.player2_score',
        'g.is_bye',
        'tp1.name as p1_name', 'tp1.etc_data as p1_etc',
        'tp2.name as p2_name', 'tp2.etc_data as p2_etc'
      )
      .where('r.division_id', divisionId)
      .where(function() {
        this.whereIn('g.player1_id', dbIds).orWhereIn('g.player2_id', dbIds);
      })
      .where('g.is_bye', false)
      .orderBy('r.round_number');

    // Group games by player (using file player ID)
    const playerGamesMap = new Map();
    playerIds.forEach(id => playerGamesMap.set(id, []));

    for (const game of games) {
      // Process for player1 if they're in our list
      if (dbIds.includes(game.player1_id)) {
        const filePlayerId = dbIdToFileIdMap.get(game.player1_id);
        const opponentEtc = game.p2_etc || {};

        playerGamesMap.get(filePlayerId)?.push({
          round: game.round_number,
          opponentName: this.formatName(game.p2_name),
          opponentHSName: `${opponentEtc.firstname1?.[0] || ''} ${opponentEtc.lastname1?.[0] || ''}`.trim(),
          opponentElemName: `${opponentEtc.firstname1?.[0] || ''} & ${opponentEtc.firstname2?.[0] || ''}`.trim(),
          playerScore: game.player1_score || 0,
          opponentScore: game.player2_score || 0,
        });
      }

      // Process for player2 if they're in our list
      if (dbIds.includes(game.player2_id)) {
        const filePlayerId = dbIdToFileIdMap.get(game.player2_id);
        const opponentEtc = game.p1_etc || {};

        playerGamesMap.get(filePlayerId)?.push({
          round: game.round_number,
          opponentName: this.formatName(game.p1_name),
          opponentHSName: `${opponentEtc.firstname1?.[0] || ''} ${opponentEtc.lastname1?.[0] || ''}`.trim(),
          opponentElemName: `${opponentEtc.firstname1?.[0] || ''} & ${opponentEtc.firstname2?.[0] || ''}`.trim(),
          playerScore: game.player2_score || 0,
          opponentScore: game.player1_score || 0,
        });
      }
    }

    // Take last 5 games for each player and reverse to chronological order
    for (const [playerId, games] of playerGamesMap) {
      const sortedGames = games.sort((a: GameResult, b: GameResult) => b.round - a.round);
      playerGamesMap.set(playerId, sortedGames.slice(0, 5).reverse());
    }

    return playerGamesMap;
  }

  async getPlayerRecentGames(tournamentId: number, divisionId: number, playerId: number): Promise<GameResult[]> {
    // Find the database player ID
    const playerResult = await this.knex('tournament_players')
      .select('id')
      .where({
        tournament_id: tournamentId,
        division_id: divisionId,
        player_id: playerId
      })
      .first();

    if (!playerResult) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    const dbPlayerId = playerResult.id;

    // Get recent games
    const games = await this.knex('games as g')
      .join('rounds as r', 'g.round_id', 'r.id')
      .leftJoin('tournament_players as tp1', 'g.player1_id', 'tp1.id')
      .leftJoin('tournament_players as tp2', 'g.player2_id', 'tp2.id')
      .select(
        'r.round_number',
        'g.player1_id',
        'g.player2_id',
        'g.player1_score',
        'g.player2_score',
        'g.is_bye',
        this.knex.raw(`
          CASE
            WHEN g.player1_id = ? THEN tp2.name
            ELSE tp1.name
          END as opponent_name
        `, [dbPlayerId]),
        this.knex.raw(`
          CASE
            WHEN g.player1_id = ? THEN tp2.etc_data
            ELSE tp1.etc_data
          END as opponent_etc
        `, [dbPlayerId])
      )
      .where('r.division_id', divisionId)
      .where(function() {
        this.where('g.player1_id', dbPlayerId).orWhere('g.player2_id', dbPlayerId);
      })
      .where('g.is_bye', false)
      .orderBy('r.round_number', 'desc')
      .limit(5);

    return games.map(game => {
      const isPlayer1 = game.player1_id === dbPlayerId;
      const playerScore = isPlayer1 ? game.player1_score : game.player2_score;
      const opponentScore = isPlayer1 ? game.player2_score : game.player1_score;
      const opponentEtc = game.opponent_etc || {};

      return {
        round: game.round_number,
        opponentName: this.formatName(game.opponent_name),
        opponentHSName: `${opponentEtc.firstname1?.[0] || ''} ${opponentEtc.lastname1?.[0] || ''}`.trim(),
        opponentElemName: `${opponentEtc.firstname1?.[0] || ''} & ${opponentEtc.firstname2?.[0] || ''}`.trim(),
        playerScore: playerScore || 0,
        opponentScore: opponentScore || 0,
      };
    }).reverse(); // Return in chronological order
  }

  private formatName(name: string): string {
    if (!name || !name.includes(",")) return name || "Unknown Player";

    const [last, first] = name.split(", ");
    if (!first || !last) return name;

    return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
  }

  private getOrdinal(n: number): string {
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return n + "th";

    switch (lastDigit) {
      case 1: return n + "st";
      case 2: return n + "nd";
      case 3: return n + "rd";
      default: return n + "th";
    }
  }
}