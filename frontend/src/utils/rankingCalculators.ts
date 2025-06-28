import { PlayerStats } from '@shared/types/tournament';
import { calculateRanks } from './tournamentHelpers';

export const calculateStandingsRanks = (players: PlayerStats[]): PlayerStats[] => {
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.spread - a.spread;
  });

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

export const calculateRatingGainRanks = (players: PlayerStats[]): PlayerStats[] => {
  const sortedPlayers = [...players].sort((a, b) => b.ratingDiff - a.ratingDiff);

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

// Re-export existing calculateRanks for scoring leaders
export { calculateRanks as calculateScoringRanks } from './tournamentHelpers';