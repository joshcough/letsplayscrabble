// frontend/src/services/interfaces.ts
// Service interfaces for dependency injection and testing
import {
  LoginRequest,
  LoginSuccessData,
  StartPollingRequest,
  PollingSuccessData,
} from "@shared/types/api";
import * as Domain from "@shared/types/domain";

import { ApiResponse } from "../config/api";

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export interface AuthService {
  login(request: LoginRequest): Promise<ApiResponse<LoginSuccessData>>;
}

// ============================================================================
// TOURNAMENT SERVICE
// ============================================================================

export interface TournamentService {
  // Core tournament operations
  getTournament(
    userId: number,
    tournamentId: number,
  ): Promise<ApiResponse<Domain.Tournament>>;
  getTournamentSummary(
    userId: number,
    tournamentId: number,
  ): Promise<ApiResponse<Domain.TournamentSummary>>;
  listTournaments(): Promise<ApiResponse<Domain.TournamentSummary[]>>;
  createTournament(params: any): Promise<ApiResponse<any>>; // TODO: Add proper types
  updateTournament(id: number, params: any): Promise<ApiResponse<any>>;
  deleteTournament(id: number): Promise<ApiResponse<void>>;

  // Division operations
  getDivisions(
    userId: number,
    tournamentId: number,
  ): Promise<ApiResponse<Domain.Division[]>>;
  getPlayersForDivision(
    userId: number,
    tournamentId: number,
    divisionName: string,
  ): Promise<ApiResponse<Domain.Player[]>>;

  // Polling operations
  enablePolling(
    tournamentId: number,
    request: StartPollingRequest,
  ): Promise<ApiResponse<PollingSuccessData>>;
  disablePolling(tournamentId: number): Promise<ApiResponse<void>>;
}

// ============================================================================
// CURRENT MATCH SERVICE
// ============================================================================

export interface CurrentMatchService {
  getCurrentMatch(
    userId: number,
  ): Promise<ApiResponse<Domain.CurrentMatch | null>>;
  setCurrentMatch(
    request: Domain.CreateCurrentMatch,
  ): Promise<ApiResponse<Domain.CurrentMatch>>;
}

// ============================================================================
// COMBINED API SERVICE
// ============================================================================

export interface ApiService
  extends AuthService,
    TournamentService,
    CurrentMatchService {
  // This combines all services into one interface for convenience
}
