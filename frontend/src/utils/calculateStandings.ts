import * as Stats from "@shared/types/stats";
import * as DB from "@shared/types/database";

export interface TournamentStats {
  gamesPlayed: number;
  pointsScored: number;
  averageScore: string;
  higherRatedWinPercent: number;
  goingFirstWinPercent: number;
  totalPlayers: number;
}

export function calculateTournamentStats(
  games: DB.GameRow[],
  players: DB.PlayerRow[],
): TournamentStats {
  const completedGames = games.filter(
    (game) =>
      game.player1_score !== null &&
      game.player2_score !== null &&
      !game.is_bye,
  );

  const gamesPlayed = completedGames.length;
  const totalPoints = completedGames.reduce(
    (sum, game) => sum + (game.player1_score || 0) + (game.player2_score || 0),
    0,
  );

  // Calculate average scores (winning vs losing)
  const winningScores: number[] = [];
  const losingScores: number[] = [];

  completedGames.forEach((game) => {
    const score1 = game.player1_score || 0;
    const score2 = game.player2_score || 0;

    if (score1 > score2) {
      winningScores.push(score1);
      losingScores.push(score2);
    } else if (score2 > score1) {
      winningScores.push(score2);
      losingScores.push(score1);
    }
    // Skip ties for average calculation
  });

  const avgWinningScore =
    winningScores.length > 0
      ? Math.round(
          winningScores.reduce((sum, score) => sum + score, 0) /
            winningScores.length,
        )
      : 0;
  const avgLosingScore =
    losingScores.length > 0
      ? Math.round(
          losingScores.reduce((sum, score) => sum + score, 0) /
            losingScores.length,
        )
      : 0;

  // Calculate going first win percentage
  const goingFirstWins = completedGames.filter(
    (game) => (game.player1_score || 0) > (game.player2_score || 0),
  ).length;
  const goingFirstWinPercent =
    gamesPlayed > 0 ? (goingFirstWins / gamesPlayed) * 100 : 0;

  // Calculate higher rated win percentage
  let higherRatedWinPercent = 0;
  if (players.length > 0) {
    const playerMap = new Map<number, DB.PlayerRow>();
    players.forEach((player) => {
      playerMap.set(player.id, player);
    });

    const getPlayerRatingBeforeRound = (
      player: DB.PlayerRow,
      roundNumber: number,
    ): number => {
      if (roundNumber === 1) {
        return player.initial_rating;
      } else {
        const ratingIndex = roundNumber - 2;
        return player.etc_data?.newr?.[ratingIndex] ?? player.initial_rating;
      }
    };

    const gamesWithRatings = completedGames.filter(
      (game) =>
        playerMap.has(game.player1_id) && playerMap.has(game.player2_id),
    );

    if (gamesWithRatings.length > 0) {
      const higherRatedWins = gamesWithRatings.filter((game) => {
        const player1 = playerMap.get(game.player1_id);
        const player2 = playerMap.get(game.player2_id);

        // Skip if either player not found (shouldn't happen due to filter above)
        if (!player1 || !player2) return false;

        const player1Rating = getPlayerRatingBeforeRound(
          player1,
          game.round_number,
        );
        const player2Rating = getPlayerRatingBeforeRound(
          player2,
          game.round_number,
        );

        const player1Higher = player1Rating > player2Rating;
        const player1Won =
          (game.player1_score || 0) > (game.player2_score || 0);

        return (player1Higher && player1Won) || (!player1Higher && !player1Won);
      }).length;

      higherRatedWinPercent = (higherRatedWins / gamesWithRatings.length) * 100;
    }
  }

  return {
    gamesPlayed,
    pointsScored: totalPoints,
    averageScore: `${avgWinningScore}-${avgLosingScore}`,
    higherRatedWinPercent: Math.round(higherRatedWinPercent * 10) / 10,
    goingFirstWinPercent: Math.round(goingFirstWinPercent * 10) / 10,
    totalPlayers: players.length,
  };
}

export function calculateAllTournamentStats(
  tournament: DB.Tournament,
): TournamentStats {
  let allGames: DB.GameRow[] = [];
  let allPlayers: DB.PlayerRow[] = [];

  tournament.divisions.forEach((divisionData) => {
    allGames = [...allGames, ...divisionData.games];
    allPlayers = [...allPlayers, ...divisionData.players];
  });

  return calculateTournamentStats(allGames, allPlayers);
}

// Helper function to format player names (assuming this exists somewhere)
const formatName = (name: string): string => {
  const parts = name.split(",");
  if (parts.length === 2) {
    return `${parts[1].trim()} ${parts[0].trim()}`;
  }
  return name;
};

// Helper function to get ordinal (1st, 2nd, 3rd, etc.)
const getOrdinal = (num: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

// Calculate stats for a single player from their games
function calculatePlayerStatsFromGames(
  player: DB.PlayerRow,
  playerGames: DB.GameRow[],
): Stats.PlayerStats {
  let totalSpread = 0;
  let totalScore = 0;
  let totalOpponentScore = 0;
  let highScore = 0;
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let gamesPlayed = 0;

  console.log(
    `🔢 Calculating stats for player ${player.name}, ${playerGames.length} games`,
  );

  for (const game of playerGames) {
    if (game.is_bye) {
      // Handle bye - need to figure out which score belongs to this player
      let byeScore: number | null = null;

      if (game.player1_id === player.id) {
        byeScore = game.player1_score;
      } else if (game.player2_id === player.id) {
        byeScore = game.player2_score;
      }

      if (byeScore !== null) {
        totalSpread += byeScore;
        if (byeScore > 0) wins += 1;
        else losses += 1;
      }
    } else {
      // Regular game - determine player's score vs opponent's score
      let playerScore: number | null = null;
      let opponentScore: number | null = null;

      if (game.player1_id === player.id) {
        playerScore = game.player1_score;
        opponentScore = game.player2_score;
      } else if (game.player2_id === player.id) {
        playerScore = game.player2_score;
        opponentScore = game.player1_score;
      }

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
  const averageOpponentScore =
    gamesPlayed > 0 ? (totalOpponentScore / gamesPlayed).toFixed(1) : "0";

  // Calculate current rating and rating diff from etc_data
  let currentRating = 0;
  let ratingDiff = 0;

  // Parse etc_data if it's a string (since it might be JSON stringified)
  let etcData: any = null;
  try {
    etcData =
      typeof player.etc_data === "string"
        ? JSON.parse(player.etc_data)
        : player.etc_data;
  } catch (e) {
    console.warn(`Failed to parse etc_data for player ${player.name}:`, e);
    etcData = player.etc_data;
  }

  if (etcData?.newr && Array.isArray(etcData.newr)) {
    currentRating = etcData.newr[etcData.newr.length - 1] ?? 0;
    ratingDiff = currentRating - player.initial_rating;
  }

  return {
    playerId: player.id,
    name: player.name,
    firstLast: formatName(player.name),
    initialRating: player.initial_rating,
    currentRating,
    ratingDiff,
    seed: player.seed, // Use actual seed, not player_id
    seedOrdinal: getOrdinal(player.seed),
    wins,
    losses,
    ties,
    spread: totalSpread,
    averageScore,
    averageScoreRounded: averageScore.toFixed(1),
    averageOpponentScore,
    highScore,
    averageScoreRank: 0, // Will be calculated later if needed
    averageOpponentScoreRank: 0,
    averageScoreRankOrdinal: "0th",
    averageOpponentScoreRankOrdinal: "0th",
    etc: etcData,
    photo: player.photo || "", // Convert null to empty string
  };
}

// Main function to calculate all player stats from division data
export const calculateStandingsFromGames = (
  games: DB.GameRow[],
  players: DB.PlayerRow[],
): Stats.PlayerStats[] => {
  console.log("🔢 calculateStandingsFromGames:", {
    games: games.length,
    players: players.length,
  });

  const playerStats: Stats.PlayerStats[] = [];

  for (const player of players) {
    // Find all games this player participated in
    const playerGames = games.filter(
      (game) => game.player1_id === player.id || game.player2_id === player.id,
    );

    console.log(`📊 Player ${player.name}: ${playerGames.length} games found`);

    // Calculate stats for this player
    const stats = calculatePlayerStatsFromGames(player, playerGames);
    playerStats.push(stats);
  }

  console.log(
    "✅ calculateStandingsFromGames complete:",
    playerStats.length,
    "players processed",
  );
  return playerStats;
};
