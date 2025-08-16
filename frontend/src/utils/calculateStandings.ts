import * as Domain from "@shared/types/domain";
import * as Stats from "@shared/types/stats";

import { getOrdinal } from "./formatUtils";
import { formatPlayerName } from "./playerUtils";

export interface TournamentStats {
  gamesPlayed: number;
  pointsScored: number;
  averageScore: string;
  higherRatedWinPercent: number;
  goingFirstWinPercent: number;
  totalPlayers: number;
}

export function calculateTournamentStats(
  games: Domain.Game[],
  players: Domain.Player[],
): TournamentStats {
  const completedGames = games.filter(
    (game) =>
      game.player1Score !== null &&
      game.player2Score !== null &&
      !game.isBye,
  );

  const gamesPlayed = completedGames.length;
  const totalPoints = completedGames.reduce(
    (sum, game) => sum + (game.player1Score || 0) + (game.player2Score || 0),
    0,
  );

  // Calculate average scores (winning vs losing)
  const winningScores: number[] = [];
  const losingScores: number[] = [];

  completedGames.forEach((game) => {
    const score1 = game.player1Score || 0;
    const score2 = game.player2Score || 0;

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
    (game) => (game.player1Score || 0) > (game.player2Score || 0),
  ).length;
  const goingFirstWinPercent =
    gamesPlayed > 0 ? (goingFirstWins / gamesPlayed) * 100 : 0;

  // Calculate higher rated win percentage
  let higherRatedWinPercent = 0;
  if (players.length > 0) {
    const playerMap = new Map<number, Domain.Player>();
    players.forEach((player) => {
      playerMap.set(player.id, player);
    });

    const getPlayerRatingBeforeRound = (
      player: Domain.Player,
      roundNumber: number,
    ): number => {
      if (roundNumber === 1) {
        return player.initialRating;
      } else {
        const ratingIndex = roundNumber - 2;
        return player.ratingsHistory?.[ratingIndex] ?? player.initialRating;
      }
    };

    const gamesWithRatings = completedGames.filter(
      (game) =>
        playerMap.has(game.player1Id) && playerMap.has(game.player2Id),
    );

    if (gamesWithRatings.length > 0) {
      const higherRatedWins = gamesWithRatings.filter((game) => {
        const player1 = playerMap.get(game.player1Id);
        const player2 = playerMap.get(game.player2Id);

        // Skip if either player not found (shouldn't happen due to filter above)
        if (!player1 || !player2) return false;

        const player1Rating = getPlayerRatingBeforeRound(
          player1,
          game.roundNumber,
        );
        const player2Rating = getPlayerRatingBeforeRound(
          player2,
          game.roundNumber,
        );

        const player1Higher = player1Rating > player2Rating;
        const player1Won =
          (game.player1Score || 0) > (game.player2Score || 0);

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
  tournament: Domain.Tournament,
): TournamentStats {
  let allGames: Domain.Game[] = [];
  let allPlayers: Domain.Player[] = [];

  tournament.divisions.forEach((divisionData) => {
    allGames = [...allGames, ...divisionData.games];
    allPlayers = [...allPlayers, ...divisionData.players];
  });

  return calculateTournamentStats(allGames, allPlayers);
}

// Calculate stats for a single player from their games
function calculatePlayerStatsFromGames(
  player: Domain.Player,
  playerGames: Domain.Game[],
): Stats.PlayerStats {
  let totalSpread = 0;
  let totalScore = 0;
  let totalOpponentScore = 0;
  let highScore = 0;
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let gamesPlayed = 0;

  for (const game of playerGames) {
    if (game.isBye) {
      // Handle bye - need to figure out which score belongs to this player
      let byeScore: number | null = null;

      if (game.player1Id === player.id) {
        byeScore = game.player1Score;
      } else if (game.player2Id === player.id) {
        byeScore = game.player2Score;
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

      if (game.player1Id === player.id) {
        playerScore = game.player1Score;
        opponentScore = game.player2Score;
      } else if (game.player2Id === player.id) {
        playerScore = game.player2Score;
        opponentScore = game.player1Score;
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

  // Calculate current rating and rating diff from ratingsHistory
  let currentRating = 0;
  let ratingDiff = 0;

  if (player.ratingsHistory && player.ratingsHistory.length > 0) {
    currentRating = player.ratingsHistory[player.ratingsHistory.length - 1];
    ratingDiff = currentRating - player.initialRating;
  } else {
    // No rating history yet, use initial rating
    currentRating = player.initialRating;
    ratingDiff = 0;
  }

  return {
    playerId: player.id,
    name: player.name,
    firstLast: formatPlayerName(player.name),
    initialRating: player.initialRating,
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
    etc: { 
      newr: player.ratingsHistory || [player.initialRating],
      p12: [] // Empty for now during domain model migration
    },
    photo: player.photo || "", // Convert null to empty string
  };
}

// Main function to calculate all player stats from division data
export const calculateStandingsFromGames = (
  games: Domain.Game[],
  players: Domain.Player[],
): Stats.PlayerStats[] => {
  console.log("🔢 calculateStandingsFromGames:", {
    games: games.length,
    players: players.length,
  });

  const playerStats: Stats.PlayerStats[] = [];

  for (const player of players) {
    // Find all games this player participated in
    const playerGames = games.filter(
      (game) => game.player1Id === player.id || game.player2Id === player.id,
    );

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
