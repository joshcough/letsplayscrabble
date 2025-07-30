import { PlayerStats } from "@shared/types/stats";

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
