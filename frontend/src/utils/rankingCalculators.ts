import * as Stats from "@shared/types/stats";

// Add rank to PlayerStats (since it's needed for display)
type RankedPlayerStats = Stats.PlayerStats & { rank: number };

export const calculateStandingsRanks = (
  players: Stats.PlayerStats[],
): RankedPlayerStats[] => {
  const sortedPlayers = [...players].sort((a, b) => {
    // Sort by wins (descending), then losses (ascending), then spread (descending)
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.spread - a.spread;
  });

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

export const calculateRatingGainRanks = (
  players: Stats.PlayerStats[],
): RankedPlayerStats[] => {
  const sortedPlayers = [...players].sort(
    (a, b) => b.ratingDiff - a.ratingDiff,
  );

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

export const calculateScoringRanks = (
  players: Stats.PlayerStats[],
): RankedPlayerStats[] => {
  const sortedPlayers = [...players].sort(
    (a, b) => b.averageScore - a.averageScore,
  );

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

export const calculateHighScoreRanks = (
  players: Stats.PlayerStats[],
): RankedPlayerStats[] => {
  const sortedPlayers = [...players].sort((a, b) => b.highScore - a.highScore);

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};
