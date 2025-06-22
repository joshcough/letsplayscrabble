import { CurrentMatch } from "@shared/types/currentMatch";
import { MatchWithPlayers } from "@shared/types/admin";
import { fetchApiEndpoint } from "./api";

/**
 * Fetch the current match basic data (lightweight)
 */
export const fetchCurrentMatch = async (): Promise<CurrentMatch | null> => {
  return fetchApiEndpoint<CurrentMatch>(
    "/api/overlay/match/current",
    "Failed to fetch current match"
  );
};

/**
 * Fetch the current match with full player data (heavy - for stats overlay only)
 */
export const fetchCurrentMatchWithPlayers = async (): Promise<MatchWithPlayers | null> => {
  return fetchApiEndpoint<MatchWithPlayers>(
    "/api/overlay/match/current_match_for_stats_delete_this_route",
    "Failed to fetch match with players"
  );
};