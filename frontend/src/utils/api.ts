// utils/api.ts - Clean API utilities for the new backend structure
import { Tournament, TournamentRow } from "@shared/types/database";

const API_BASE: string =
  process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:3001";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Base fetch function with error handling
const baseFetch = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const url = `${API_BASE}${endpoint}`;
  console.log("🌐 API Request:", url);

  const response = await fetch(url, options);

  console.log("📡 API Response:", {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  return response;
};

// Parse API response (handles both ApiResponse format and raw data)
const parseApiResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If we can't parse error JSON, use the status text
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // If it's wrapped in ApiResponse format, unwrap it
  if (data && typeof data === "object" && "success" in data) {
    const apiResponse = data as ApiResponse<T>;
    if (apiResponse.success) {
      return apiResponse.data;
    } else {
      throw new Error(apiResponse.error);
    }
  }

  // Otherwise return raw data
  return data as T;
};

// Public tournament endpoints (no auth required)

export const fetchTournament = async (
  userId: number,
  tournamentId: number,
  divisionId?: number,
): Promise<Tournament> => {
  // Choose endpoint based on whether division is specified
  const endpoint =
    divisionId !== undefined
      ? `/api/public/users/${userId}/tournaments/${tournamentId}/divisions/${divisionId}`
      : `/api/public/users/${userId}/tournaments/${tournamentId}`;

  const response = await baseFetch(endpoint);
  return parseApiResponse<Tournament>(response);
};

export const fetchTournamentRow = async (
  userId: number,
  tournamentId: number,
  divisionId?: number,
): Promise<TournamentRow> => {
  const response = await baseFetch(
    `/api/public/users/${userId}/tournaments/${tournamentId}/row`,
  );
  return parseApiResponse<TournamentRow>(response);
};

// Keep the existing fetchTournamentDivision for backward compatibility if needed
export const fetchTournamentDivision = async (
  userId: number,
  tournamentId: number,
  divisionId: number,
): Promise<Tournament> => {
  // This now just calls the updated fetchTournament
  return fetchTournament(userId, tournamentId, divisionId);
};

// Authenticated endpoints (require Bearer token)
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

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

// Legacy exports for backward compatibility - add these missing functions
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

export const fetchApiResponseWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const data = await fetchWithAuth<T>(endpoint, options);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export { API_BASE };
