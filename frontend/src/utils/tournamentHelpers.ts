import { PlayerStats } from "@shared/types/stats";
import * as DB from "@shared/types/database";

/**
 * Calculate ranks for players based on average score
 */
export const calculateRanks = (players: PlayerStats[]): PlayerStats[] => {
  const sortedPlayers = [...players].sort((a, b) => {
    return b.averageScore - a.averageScore;
  });

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

/**
 * Format a number with a + sign for positive values
 */
export const formatNumberWithSign = (value: number): string => {
  return value > 0 ? `+${value}` : value.toString();
};

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
