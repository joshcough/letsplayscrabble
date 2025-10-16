import { PlayerStats } from "../types/stats";
import * as Domain from "@shared/types/domain";

const baseUrl = "https://scrabbleplayers.org/directors/AA003954/";

export const getTournamentName = (tourney_url: string): string => {
  const suffix = "/html/tourney.js";
  // Handle both NASPA URLs and other tournament URLs
  if (tourney_url.startsWith(baseUrl)) {
    return tourney_url.slice(baseUrl.length, -suffix.length);
  }
  // For non-NASPA URLs, extract the tournament name from the path
  const match = tourney_url.match(/\/([^\/]+)\/html\/tourney\.js$/);
  return match ? match[1] : "";
};

export const getPlayerImageUrl = (
  tourney_url: string,
  player_photo: string | undefined,
  crossTablesPhotoUrl?: string,
): string => {
  // First, check if we have a valid photo from the tournament file
  if (player_photo && player_photo !== "undefined" && player_photo !== "") {
    // If it's a NASPA tournament URL, construct the full photo URL
    if (tourney_url.includes("scrabbleplayers.org")) {
      return baseUrl + getTournamentName(tourney_url) + "/html/" + player_photo;
    }
    // For other tournaments, assume photo is a relative path from the tournament directory
    const tournamentBaseUrl = tourney_url.replace(/\/tourney\.js$/, "");
    return `${tournamentBaseUrl}/${player_photo}`;
  }
  
  // Fall back to CrossTables photo if available
  if (crossTablesPhotoUrl && crossTablesPhotoUrl !== "") {
    return crossTablesPhotoUrl;
  }
  
  // Return a data URI placeholder image if no photo is available
  // This is a simple gray square with "No Photo" text
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%236b7280'%3ENo Photo%3C/text%3E%3C/svg%3E";
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

// Convert "FirstName LastName" to "LastName, FirstName" format
export const formatPlayerNameReverse = (name: string): string => {
  if (name === "BYE" || name === "Unknown" || name.includes(",")) {
    return name; // Already in LastName, FirstName format or special case
  }

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return name; // Single name, return as-is
  }

  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  return `${lastName}, ${firstName}`;
};

// Get the last name from a full name for sorting
export const getLastName = (fullName: string): string => {
  if (fullName === "BYE" || fullName === "Unknown") {
    return fullName;
  }

  // Handle "LastName, FirstName" format
  if (fullName.includes(",")) {
    const parts = fullName.split(",").map(part => part.trim());
    return parts[0]; // First part is the last name
  }

  // Handle "FirstName LastName" format
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1]; // Last word is the last name
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

// Helper to determine if we should show "Seed" or "Place"
// Players with 0-0 record haven't played yet, so they're still at their seed position
export const getPlaceOrSeedLabel = (player: PlayerStats | { wins: number; losses: number }): string => {
  return (player.wins === 0 && player.losses === 0) ? 'Seed' : 'Place';
};

// Helper for under-cam display with spread
export const formatUnderCamRecord = (player: PlayerStats): string => {
  return `${formatRecord(player)} ${formatSpread(player.spread)}`;
};

// Helper for full under-cam display (with place and seed)
export const formatFullUnderCam = (player: PlayerStats): string => {
  const label = getPlaceOrSeedLabel(player);
  if (label === 'Seed') {
    // For 0-0 players, just show seed (no redundant seed in parentheses)
    return `${formatUnderCamRecord(player)} | ${player.rankOrdinal || "N/A"} Seed`;
  }
  // For players with games played, show place with original seed in parentheses
  return `${formatUnderCamRecord(player)} | ${player.rankOrdinal || "N/A"} Place (${player.seedOrdinal || "N/A"} Seed)`;
};

// Helper for under-cam without seed
export const formatUnderCamNoSeed = (player: PlayerStats): string => {
  return `${formatUnderCamRecord(player)} | ${player.rankOrdinal || "N/A"} ${getPlaceOrSeedLabel(player)}`;
};

// Helper for full under-cam display (with place and rating)
export const formatFullUnderCamWithRating = (player: PlayerStats): string => {
  return `${formatUnderCamRecord(player)} | ${player.rankOrdinal || "N/A"} ${getPlaceOrSeedLabel(player)} | Rating ${player.currentRating}`;
};

// Helper for best of 7 format
export const formatBestOf7 = (player: PlayerStats): string => {
  return `Best of 7 Record: ${formatUnderCamRecord(player)}`;
};

// Get current rating from player's rating history or initial rating
export const getCurrentRating = (player: Domain.Player): number => {
  // If player has ratings history (etc.newr array) with values, use the last one
  if (player.ratingsHistory && player.ratingsHistory.length > 0) {
    return player.ratingsHistory[player.ratingsHistory.length - 1];
  }
  // Otherwise fall back to initial rating
  return player.initialRating;
};
