// frontend/src/services/interfaces.ts
// Service interfaces for dependency injection and testing
import {
  LoginRequest,
  LoginSuccessData,
  StartPollingRequest,
  PollingSuccessData,
} from "@shared/types/api";
import * as Domain from "@shared/types/domain";

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export interface AuthService {
  login(request: LoginRequest): Promise<LoginSuccessData>;
}

// ============================================================================
// TOURNAMENT SERVICE
// ============================================================================

export interface TournamentService {
  // Core tournament operations
  getTournament(
    userId: number,
    tournamentId: number,
  ): Promise<Domain.Tournament>;
  getTournamentSummary(
    userId: number,
    tournamentId: number,
  ): Promise<Domain.TournamentSummary>;
  listTournaments(): Promise<Domain.TournamentSummary[]>;
  createTournament(params: any): Promise<any>; // TODO: Add proper types
  updateTournament(id: number, params: any): Promise<any>;
  deleteTournament(id: number): Promise<void>;

  // Division operations
  getDivisions(
    userId: number,
    tournamentId: number,
  ): Promise<Domain.Division[]>;
  getPlayersForDivision(
    userId: number,
    tournamentId: number,
    divisionName: string,
  ): Promise<Domain.Player[]>;

  // Polling operations
  enablePolling(
    tournamentId: number,
    request: StartPollingRequest,
  ): Promise<PollingSuccessData>;
  disablePolling(tournamentId: number): Promise<void>;
}

// ============================================================================
// CURRENT MATCH SERVICE
// ============================================================================

export interface CurrentMatchService {
  getCurrentMatch(userId: number): Promise<Domain.CurrentMatch | null>;
  setCurrentMatch(
    request: Domain.CreateCurrentMatch,
  ): Promise<Domain.CurrentMatch>;
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
