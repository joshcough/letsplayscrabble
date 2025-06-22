import { PlayerStats } from "@shared/types/tournament";

const baseUrl = "https://scrabbleplayers.org/directors/AA003954/";

export const getTournamentName = (tourney_url: string): string => {
  const suffix = "/html/tourney.js";
  return tourney_url.slice(baseUrl.length, -suffix.length);
};

export const getPlayerImageUrl = (tourney_url: string, player_photo: string): string => {
  return baseUrl + getTournamentName(tourney_url) + "/html/" + player_photo;
};

export const formatPlayerName = (name: string): string => {
  if (!name.includes(',')) { return name; }
  const parts = name.split(',').map(part => part.trim());
  // Return original if format is unexpected
  if (parts.length !== 2 || !parts[0] || !parts[1]) { return name; }
  const [lastName, firstName] = parts;
  return `${firstName} ${lastName}`;
};

export type SortType = 'highScore' | 'averageScore' | 'ratingDiff';

export const calculateRanksBySortType = (players: PlayerStats[], sortType: SortType): PlayerStats[] => {
  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortType) {
      case 'highScore':
        return b.highScore - a.highScore;
      case 'averageScore':
        return b.averageScore - a.averageScore;
      case 'ratingDiff':
        return b.ratingDiff - a.ratingDiff;
      default:
        return 0;
    }
  });

  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};