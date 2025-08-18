// shared/types/api.ts
// API request and response types (no generics - those stay in frontend/backend)
// Note: All endpoints return ApiResponse<T> where T is the success data type
// Note: Domain types like CreateCurrentMatch are in domain.ts
// Note: Database types like TournamentMetadata are in backend/src/types/database.ts

// ============================================================================
// AUTH API
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginSuccessData {
  token: string;
  user: {
    id: number;
    username: string;
  };
}

// ============================================================================
// TOURNAMENT POLLING API
// ============================================================================

export interface StartPollingRequest {
  pollUntilMinutes: number;
}

export interface PollingSuccessData {
  pollUntil: string;
}

export interface EnablePollingRequest {
  days: number;
}

// ============================================================================
// ROUTE PARAMETER INTERFACES
// ============================================================================

export interface TournamentIdParams {
  id: string;
}

export interface UserTournamentParams {
  userId: string;
  tournamentId: string;
  divisionId?: string;
}

// ============================================================================
// COMMON SUCCESS DATA PATTERNS
// ============================================================================

// For delete operations that just confirm success
export interface DeleteSuccessData {
  message: string;
}

// For operations that just confirm completion
export interface EmptySuccessData {}