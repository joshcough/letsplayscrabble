import * as DB from "@shared/types/database";

// Helper function to get recent games for a player
export const getRecentGamesForPlayer = (
  playerId: number,
  games: DB.GameRow[],
  players: DB.PlayerRow[],
  limit: number = 5,
) => {
  const playerGames = games.filter(
    (game) => game.player1_id === playerId || game.player2_id === playerId,
  );

  const sortedGames = playerGames.sort(
    (a, b) => b.round_number - a.round_number,
  );

  return sortedGames.slice(0, limit).map((game) => {
    const isPlayer1 = game.player1_id === playerId;
    const opponentId = isPlayer1 ? game.player2_id : game.player1_id;
    const opponent = players.find((p) => p.id === opponentId);

    return {
      round: game.round_number,
      opponentName: opponent?.name || "Unknown",
      playerScore: (isPlayer1 ? game.player1_score : game.player2_score) || 0,
      opponentScore: (isPlayer1 ? game.player2_score : game.player1_score) || 0,
    };
  });
};

// Helper function to get high score for a division
export const getHighScoreForDivision = (
  tournament: DB.Tournament,
  divisionId: number,
) => {
  const division = tournament.divisions.find(
    (d) => d.division.id === divisionId,
  );
  if (!division) return { score: 0, playerName: "", gameId: 0 };

  let highScore = 0;
  let highScorePlayerName = "";
  let highScoreGameId = 0;

  for (const game of division.games) {
    if (game.player1_score && game.player1_score > highScore) {
      highScore = game.player1_score;
      const player = division.players.find((p) => p.id === game.player1_id);
      highScorePlayerName = player?.name || "Unknown";
      highScoreGameId = game.id;
    }
    if (game.player2_score && game.player2_score > highScore) {
      highScore = game.player2_score;
      const player = division.players.find((p) => p.id === game.player2_id);
      highScorePlayerName = player?.name || "Unknown";
      highScoreGameId = game.id;
    }
  }

  return {
    score: highScore,
    playerName: highScorePlayerName,
    gameId: highScoreGameId,
  };
};

// Helper function to get highest score from changes only
export const getHighScoreFromChanges = (
  changes: DB.GameChanges,
  divisionId: number,
  players: DB.PlayerRow[],
) => {
  let highScore = 0;
  let highScorePlayerName = "";

  // Check added games
  for (const game of changes.added.filter(
    (g) => g.division_id === divisionId,
  )) {
    if (game.player1_score && game.player1_score > highScore) {
      highScore = game.player1_score;
      const player = players.find((p) => p.id === game.player1_id);
      highScorePlayerName = player?.name || "Unknown";
    }
    if (game.player2_score && game.player2_score > highScore) {
      highScore = game.player2_score;
      const player = players.find((p) => p.id === game.player2_id);
      highScorePlayerName = player?.name || "Unknown";
    }
  }

  // Check updated games
  for (const game of changes.updated.filter(
    (g) => g.division_id === divisionId,
  )) {
    if (game.player1_score && game.player1_score > highScore) {
      highScore = game.player1_score;
      const player = players.find((p) => p.id === game.player1_id);
      highScorePlayerName = player?.name || "Unknown";
    }
    if (game.player2_score && game.player2_score > highScore) {
      highScore = game.player2_score;
      const player = players.find((p) => p.id === game.player2_id);
      highScorePlayerName = player?.name || "Unknown";
    }
  }

  return { score: highScore, playerName: highScorePlayerName };
};

// Helper to determine if a player won a game
export const didPlayerWinGame = (
  game: DB.GameRow,
  playerId: number,
): boolean => {
  if (game.is_bye) {
    // For byes, check if the player got a positive score
    const playerScore =
      game.player1_id === playerId ? game.player1_score : game.player2_score;
    return (playerScore || 0) > 0;
  }

  // For regular games, compare scores
  const playerScore =
    game.player1_id === playerId ? game.player1_score : game.player2_score;
  const opponentScore =
    game.player1_id === playerId ? game.player2_score : game.player1_score;

  return (playerScore || 0) > (opponentScore || 0);
};

// Helper to calculate current win streak for a player
export const calculateWinStreak = (
  playerId: number,
  allGames: DB.GameRow[],
): number => {
  // Get all games for this player, sorted by round (newest first)
  const playerGames = allGames
    .filter(
      (game) => game.player1_id === playerId || game.player2_id === playerId,
    )
    .filter(
      (game) => game.player1_score !== null && game.player2_score !== null,
    ) // Only completed games
    .sort((a, b) => b.round_number - a.round_number);

  let streak = 0;

  // Count consecutive wins from most recent game backwards
  for (const game of playerGames) {
    if (didPlayerWinGame(game, playerId)) {
      streak++;
    } else {
      break; // Streak ends at first loss
    }
  }

  return streak;
};
