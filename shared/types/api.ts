// shared/types/api.ts
// API request and response types (no generics - those stay in frontend/backend)
// Note: Domain types like CreateCurrentMatch are in domain.ts
// Note: Database types like TournamentMetadata are in backend/src/types/database.ts

// ============================================================================
// AUTH API
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
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

export interface PollingResponse {
  pollUntil: string;
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export interface ErrorResponse {
  error: string;
}

// ============================================================================
// COMMON RESPONSE PATTERNS
// ============================================================================

export interface SuccessResponse {
  success: true;
}

export interface DeleteResponse {
  message: string;
}