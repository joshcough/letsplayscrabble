import { PlayerStats } from "@shared/types/stats";

const baseUrl = "https://scrabbleplayers.org/directors/AA003954/";

export const getTournamentName = (tourney_url: string): string => {
  const suffix = "/html/tourney.js";
  return tourney_url.slice(baseUrl.length, -suffix.length);
};

export const getPlayerImageUrl = (
  tourney_url: string,
  player_photo: string,
): string => {
  return baseUrl + getTournamentName(tourney_url) + "/html/" + player_photo;
};

export const formatPlayerName = (name: string): string => {
  if (!name.includes(",")) {
    return name;
  }
  const parts = name.split(",").map((part) => part.trim());
  // Return original if format is unexpected
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return name;
  }
  const [lastName, firstName] = parts;
  return `${firstName} ${lastName}`;
};

// Helper to format spread with proper sign
export const formatSpread = (spread: number | undefined): string => {
  if (spread === undefined || spread === null) return "+0";
  return spread > 0 ? `+${spread}` : `${spread}`;
};

// Helper to format record (wins-losses-ties, omit ties if 0)
export const formatRecord = (player: PlayerStats): string => {
  const wins = player.wins || 0;
  const losses = player.losses || 0;
  const ties = player.ties || 0;

  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
};

// Helper for under-cam display with spread
export const formatUnderCamRecord = (player: PlayerStats): string => {
  return `${formatRecord(player)} ${formatSpread(player.spread)}`;
};

// Helper for full under-cam display (with place and seed)
export const formatFullUnderCam = (player: PlayerStats): string => {
  return `${formatUnderCamRecord(player)} | ${player.rankOrdinal || "N/A"} Place (${player.seedOrdinal || "N/A"} Seed)`;
};

// Helper for under-cam without seed
export const formatUnderCamNoSeed = (player: PlayerStats): string => {
  return `${formatUnderCamRecord(player)} | ${player.rankOrdinal || "N/A"} Place`;
};

// Helper for full under-cam display (with place and rating)
export const formatFullUnderCamWithRating = (player: PlayerStats): string => {
  return `${formatUnderCamRecord(player)} | ${player.rankOrdinal || "N/A"} Place | Rating ${player.currentRating}`;
};

// Helper for best of 7 format
export const formatBestOf7 = (player: PlayerStats): string => {
  return `Best of 7 Record: ${formatUnderCamRecord(player)}`;
};
