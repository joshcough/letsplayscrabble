import * as Domain from "@shared/types/domain";

// Helper function to get recent games for a player
export const getRecentGamesForPlayer = (
  playerId: number,
  games: Domain.Game[],
  players: Domain.Player[],
  limit: number = 5,
) => {
  const playerGames = games.filter(
    (game) => game.player1Id === playerId || game.player2Id === playerId,
  );

  // Filter out games with no scores (unplayed games) before sorting
  const playedGames = playerGames.filter(
    (game) => game.player1Score !== null && game.player2Score !== null,
  );

  const sortedGames = playedGames.sort((a, b) => b.roundNumber - a.roundNumber);

  return sortedGames.slice(0, limit).map((game) => {
    const isPlayer1 = game.player1Id === playerId;
    const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
    const opponent = players.find((p) => p.id === opponentId);

    return {
      round: game.roundNumber,
      opponentName: opponent?.name || "Unknown",
      playerScore: (isPlayer1 ? game.player1Score : game.player2Score) || 0,
      opponentScore: (isPlayer1 ? game.player2Score : game.player1Score) || 0,
    };
  });
};

// Helper function to get high score for a division
export const getHighScoreForDivision = (
  tournament: Domain.Tournament,
  divisionId: number,
) => {
  const division = tournament.divisions.find((d) => d.id === divisionId);
  if (!division) return { score: 0, playerName: "", gameId: 0 };

  let highScore = 0;
  let highScorePlayerName = "";
  let highScoreGameId = 0;

  for (const game of division.games) {
    if (game.player1Score && game.player1Score > highScore) {
      highScore = game.player1Score;
      const player = division.players.find((p) => p.id === game.player1Id);
      highScorePlayerName = player?.name || "Unknown";
      highScoreGameId = game.id;
    }
    if (game.player2Score && game.player2Score > highScore) {
      highScore = game.player2Score;
      const player = division.players.find((p) => p.id === game.player2Id);
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
  changes: Domain.GameChanges,
  divisionId: number,
  players: Domain.Player[],
) => {
  let highScore = 0;
  let highScorePlayerName = "";

  // For domain changes, we need to check if players belong to the division
  const divisionPlayerIds = new Set(players.map((p) => p.id));

  // Check added games
  for (const game of changes.added.filter(
    (g) =>
      divisionPlayerIds.has(g.player1Id) || divisionPlayerIds.has(g.player2Id),
  )) {
    if (game.player1Score && game.player1Score > highScore) {
      highScore = game.player1Score;
      const player = players.find((p) => p.id === game.player1Id);
      highScorePlayerName = player?.name || "Unknown";
    }
    if (game.player2Score && game.player2Score > highScore) {
      highScore = game.player2Score;
      const player = players.find((p) => p.id === game.player2Id);
      highScorePlayerName = player?.name || "Unknown";
    }
  }

  // Check updated games
  for (const game of changes.updated.filter(
    (g) =>
      divisionPlayerIds.has(g.player1Id) || divisionPlayerIds.has(g.player2Id),
  )) {
    if (game.player1Score && game.player1Score > highScore) {
      highScore = game.player1Score;
      const player = players.find((p) => p.id === game.player1Id);
      highScorePlayerName = player?.name || "Unknown";
    }
    if (game.player2Score && game.player2Score > highScore) {
      highScore = game.player2Score;
      const player = players.find((p) => p.id === game.player2Id);
      highScorePlayerName = player?.name || "Unknown";
    }
  }

  return { score: highScore, playerName: highScorePlayerName };
};

// Helper to determine if a player won a game
export const didPlayerWinGame = (
  game: Domain.Game,
  playerId: number,
): boolean => {
  if (game.isBye) {
    // For byes, check if the player got a positive score
    const playerScore =
      game.player1Id === playerId ? game.player1Score : game.player2Score;
    return (playerScore || 0) > 0;
  }

  // For regular games, compare scores
  const playerScore =
    game.player1Id === playerId ? game.player1Score : game.player2Score;
  const opponentScore =
    game.player1Id === playerId ? game.player2Score : game.player1Score;

  return (playerScore || 0) > (opponentScore || 0);
};

// Helper to calculate current win streak for a player
export const calculateWinStreak = (
  playerId: number,
  allGames: Domain.Game[],
): number => {
  // Get all games for this player, sorted by round (newest first)
  const playerGames = allGames
    .filter(
      (game) => game.player1Id === playerId || game.player2Id === playerId,
    )
    .filter((game) => game.player1Score !== null && game.player2Score !== null) // Only completed games
    .sort((a, b) => b.roundNumber - a.roundNumber);

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
