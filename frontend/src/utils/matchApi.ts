import * as Domain from "@shared/types/domain";

import {
  fetchUserOverlayEndpoint,
  postAuthenticatedApiEndpoint,
} from "../services/api";

export const fetchCurrentMatch = async (
  userId: number,
): Promise<Domain.CurrentMatch | null> => {
  return fetchUserOverlayEndpoint<Domain.CurrentMatch>(
    userId,
    "/match/current",
    "Failed to fetch current match",
  );
};

export const fetchCurrentMatchWithPlayers = async (
  userId: number,
): Promise<any | null> => {
  return fetchUserOverlayEndpoint<any>(
    userId,
    "/match/current_match_for_stats_delete_this_route",
    "Failed to fetch match with players",
  );
};

/**
 * Set the current match for the authenticated admin user
 */
export const setCurrentMatch = async (
  matchData: Domain.CreateCurrentMatch,
): Promise<any | null> => {
  return postAuthenticatedApiEndpoint<any>(
    "/api/admin/match/current",
    matchData,
    "Failed to set current match",
  );
};
