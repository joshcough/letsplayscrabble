// services/api.ts - Centralized API calls for the application
import * as Domain from "@shared/types/domain";

import {
  baseFetch,
  parseApiResponse,
  getAuthHeaders,
  fetchApiResponseWithAuth as utilsFetchApiResponseWithAuth,
} from "../utils/api";

// ============================================================================
// PUBLIC API CALLS (no auth required)
// ============================================================================


export const fetchTournamentSummary = async (
  userId: number,
  tournamentId: number,
): Promise<Domain.TournamentSummary> => {
  const tournamentData = await fetchTournament(userId, tournamentId);
  
  // Get polling data from the old endpoint (admin-specific data)
  let pollUntil: Date | null = null;
  try {
    const response = await baseFetch(`/api/public/users/${userId}/tournaments/${tournamentId}/row`);
    const rowData: any = parseApiResponse<any>(response);
    pollUntil = rowData.poll_until ? new Date(rowData.poll_until) : null;
  } catch (error) {
    console.warn("Could not fetch polling data:", error);
  }
  
  // Extract just the metadata from the full tournament
  const { divisions, ...summary } = tournamentData;
  return { ...summary, pollUntil };
};


export const fetchPlayersForDivision = async (
  userId: number,
  tournamentId: number,
  divisionName: string,
): Promise<Domain.Player[]> => {
  const tournamentData = await fetchTournament(userId, tournamentId);
  const division = tournamentData.divisions.find(d => d.name === divisionName);
  return division ? division.players : [];
};

export const fetchDivisions = async (
  userId: number,
  tournamentId: number,
): Promise<Domain.Division[]> => {
  const tournamentData = await fetchTournament(userId, tournamentId);
  return tournamentData.divisions;
};

// ============================================================================
// TOURNAMENT API CALLS - Domain Model (tree structure)
// ============================================================================

export const fetchTournament = async (
  userId: number,
  tournamentId: number,
  divisionId?: number,
): Promise<Domain.Tournament> => {
  const endpoint =
    divisionId !== undefined
      ? `/api/public/v2/users/${userId}/tournaments/${tournamentId}/divisions/${divisionId}`
      : `/api/public/v2/users/${userId}/tournaments/${tournamentId}`;

  const response = await baseFetch(endpoint);
  return parseApiResponse<Domain.Tournament>(response);
};

// ============================================================================
// AUTHENTICATED API CALLS (require Bearer token)
// ============================================================================

export const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await baseFetch(endpoint, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  return parseApiResponse<T>(response);
};

export const postWithAuth = async <T>(
  endpoint: string,
  body: any,
): Promise<T> => {
  const response = await baseFetch(endpoint, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return parseApiResponse<T>(response);
};

export const putWithAuth = async <T>(
  endpoint: string,
  body: any,
): Promise<T> => {
  const response = await baseFetch(endpoint, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return parseApiResponse<T>(response);
};

export const deleteWithAuth = async <T>(endpoint: string): Promise<T> => {
  const response = await baseFetch(endpoint, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return parseApiResponse<T>(response);
};

// ============================================================================
// AUTH API CALLS
// ============================================================================

export const loginUser = async (credentials: {
  username: string;
  password: string;
}): Promise<{ token: string; user: any }> => {
  const response = await baseFetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  return parseApiResponse<{ token: string; user: any }>(response);
};

// ============================================================================
// LEGACY WRAPPER FUNCTIONS (for backward compatibility)
// ============================================================================

export const fetchAuthenticatedApiEndpoint = async <T>(
  endpoint: string,
  errorContext: string,
  options: RequestInit = {},
): Promise<T | null> => {
  try {
    return await fetchWithAuth<T>(endpoint, options);
  } catch (error) {
    console.error(`Error ${errorContext.toLowerCase()}:`, error);
    return null;
  }
};

export const fetchUserOverlayEndpoint = async <T>(
  userId: number,
  endpoint: string,
  errorContext: string,
): Promise<T | null> => {
  try {
    const userScopedEndpoint = `/api/overlay/users/${userId}${endpoint}`;
    return await fetchWithAuth<T>(userScopedEndpoint);
  } catch (error) {
    console.error(`Error ${errorContext.toLowerCase()}:`, error);
    return null;
  }
};

export const fetchUserTournamentEndpoint = async <T>(
  userId: number,
  endpoint: string,
  errorContext: string,
): Promise<T | null> => {
  try {
    const userScopedEndpoint = `/api/tournaments/public/users/${userId}${endpoint}`;
    const response = await baseFetch(userScopedEndpoint);
    return parseApiResponse<T>(response);
  } catch (error) {
    console.error(`Error ${errorContext.toLowerCase()}:`, error);
    return null;
  }
};

export const postAuthenticatedApiEndpoint = async <T, B = any>(
  endpoint: string,
  body: B,
  errorContext: string,
): Promise<T | null> => {
  try {
    return await postWithAuth<T>(endpoint, body);
  } catch (error) {
    console.error(`Error ${errorContext.toLowerCase()}:`, error);
    return null;
  }
};

// Re-export utility function
export const fetchApiResponseWithAuth = utilsFetchApiResponseWithAuth;

// ============================================================================
// TOURNAMENT MANAGEMENT API CALLS
// ============================================================================

export const createTournament = async (tournament: any): Promise<void> => {
  await postWithAuth("/api/private/tournaments", tournament);
};

export const updateTournament = async (
  tournamentId: number,
  tournament: any,
): Promise<void> => {
  await putWithAuth(`/api/private/tournaments/${tournamentId}`, tournament);
};

export const deleteTournament = async (tournamentId: number): Promise<void> => {
  await deleteWithAuth(`/api/private/tournaments/${tournamentId}`);
};

export const enableTournamentPolling = async (
  tournamentId: number,
  days?: number,
): Promise<string> => {
  return await postWithAuth(
    `/api/private/tournaments/${tournamentId}/polling`,
    { days },
  );
};

export const disableTournamentPolling = async (
  tournamentId: number,
): Promise<void> => {
  await deleteWithAuth(`/api/private/tournaments/${tournamentId}/polling`);
};

export const listTournaments = async (): Promise<Domain.TournamentSummary[]> => {
  // TODO: Create a backend endpoint that returns tournament summaries
  // For now, we'll need to fetch from the existing endpoint and transform
  const response = await fetchWithAuth<any[]>("/api/private/tournaments/list");
  return response.map((row: any): Domain.TournamentSummary => ({
    id: row.id,
    name: row.name,
    city: row.city,
    year: row.year,
    lexicon: row.lexicon,
    longFormName: row.long_form_name,
    dataUrl: row.data_url,
    pollUntil: row.poll_until ? new Date(row.poll_until) : null,
  }));
};

// ============================================================================
// ADMIN MATCH API CALLS
// ============================================================================

export const setCurrentMatch = async (matchData: {
  tournament_id: number;
  division_id: number;
  round: number;
  pairing_id: number;
}): Promise<void> => {
  await postWithAuth("/api/admin/match/current", matchData);
};

// For backward compatibility with existing code that expects a return value
export const setCurrentMatchWithResult = async (matchData: {
  tournament_id: number;
  division_id: number;
  round: number;
  pairing_id: number;
}): Promise<any | null> => {
  try {
    return await postWithAuth("/api/admin/match/current", matchData);
  } catch (error) {
    console.error("Failed to set current match:", error);
    return null;
  }
};
