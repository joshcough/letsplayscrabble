// frontend/src/services/interfaces.ts
// Service interfaces for dependency injection and testing
import {
  LoginRequest,
  LoginSuccessData,
  EnablePollingRequest,
  PollingSuccessData,
  UserSettingsSuccessData,
  UpdateUserSettingsRequest,
} from "@shared/types/api";
import * as Domain from "@shared/types/domain";

import { ApiResponse } from "../config/api";

// Tournament creation/update parameters
export interface CreateTournamentParams {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
  theme?: string;
  transparentBackground?: boolean;
}

export interface UpdateTournamentParams extends Partial<CreateTournamentParams> {}

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
  createTournament(params: CreateTournamentParams): Promise<ApiResponse<Domain.Tournament>>;
  updateTournament(id: number, params: UpdateTournamentParams): Promise<ApiResponse<Domain.Tournament>>;
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
    request: EnablePollingRequest,
  ): Promise<ApiResponse<PollingSuccessData>>;
  disablePolling(tournamentId: number): Promise<ApiResponse<void>>;

  // Data refetch operations
  refetchTournament(tournamentId: number): Promise<ApiResponse<{ message: string }>>;
  clearTournamentCache(): Promise<ApiResponse<{ message: string }>>;
  fullRefetchTournament(tournamentId: number): Promise<ApiResponse<{ message: string }>>;
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
// USER SETTINGS SERVICE
// ============================================================================

export interface UserSettingsService {
  getUserSettings(): Promise<ApiResponse<UserSettingsSuccessData>>;
  updateUserSettings(
    request: UpdateUserSettingsRequest,
  ): Promise<ApiResponse<UserSettingsSuccessData>>;
}

// ============================================================================
// COMBINED API SERVICE
// ============================================================================

export interface ApiService
  extends AuthService,
    TournamentService,
    CurrentMatchService,
    UserSettingsService {
  // This combines all services into one interface for convenience
}
