import { CurrentMatch } from "@shared/types/currentMatch";
import { MatchWithPlayers } from "@shared/types/admin";
import { fetchUserOverlayEndpoint, postAuthenticatedApiEndpoint } from "./api";

export const fetchCurrentMatch = async (
  userId: number,
): Promise<CurrentMatch | null> => {
  return fetchUserOverlayEndpoint<CurrentMatch>(
    userId,
    "/match/current",
    "Failed to fetch current match",
  );
};

export const fetchCurrentMatchWithPlayers = async (
  userId: number,
): Promise<MatchWithPlayers | null> => {
  return fetchUserOverlayEndpoint<MatchWithPlayers>(
    userId,
    "/match/current_match_for_stats_delete_this_route",
    "Failed to fetch match with players",
  );
};

/**
 * Set the current match for the authenticated admin user
 */
export const setCurrentMatch = async (matchData: {
  tournament_id: number;
  division_id: number;
  round: number;
  pairing_id: number;
}): Promise<MatchWithPlayers | null> => {
  return postAuthenticatedApiEndpoint<MatchWithPlayers>(
    "/api/admin/match/current",
    matchData,
    "Failed to set current match",
  );
};
