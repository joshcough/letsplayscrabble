import * as Domain from "@shared/types/domain";

import { ApiService } from "../services/interfaces";

export const fetchCurrentMatch = async (
  userId: number,
  apiService: ApiService,
): Promise<Domain.CurrentMatch | null> => {
  const response = await apiService.getCurrentMatch(userId);
  return response.success ? response.data : null;
};

export const fetchCurrentMatchWithPlayers = async (
  userId: number,
  apiService: ApiService,
): Promise<any | null> => {
  // This function uses a deprecated route - consider removing or updating
  // For now, we'll return null as it's marked for deletion in the route name
  console.warn(
    "fetchCurrentMatchWithPlayers uses deprecated route - consider removing",
  );
  return null;
};

/**
 * Set the current match for the authenticated admin user
 */
export const setCurrentMatch = async (
  matchData: Domain.CreateCurrentMatch,
  apiService: ApiService,
): Promise<Domain.CurrentMatch | null> => {
  const response = await apiService.setCurrentMatch(matchData);
  return response.success ? response.data : null;
};
