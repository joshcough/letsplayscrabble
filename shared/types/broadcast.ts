// shared/types/broadcast.ts - Broadcast channel messages between worker and overlays

import { Tournament, GameChanges } from "./database";

// Messages FROM overlays TO worker
export interface SubscribeMessage {
  userId: number;
  tournamentId: number;
  divisionId?: number;
}

// Messages FROM worker TO overlays

// For SUBSCRIBE responses - initial data load
export interface TournamentDataResponse {
  userId: number;
  tournamentId: number;
  data: Tournament;
}

// For AdminPanelUpdate - new tournament/division selected
export interface TournamentDataRefresh {
  userId: number;
  tournamentId: number;
  data: Tournament;
  reason: 'admin_panel_update';
}

// For GamesAdded - incremental changes with change metadata
export interface TournamentDataIncremental {
  userId: number;
  tournamentId: number;
  data: Tournament;
  previousData?: Tournament;
  changes: GameChanges;
  reason: 'games_added';
}

// Error handling
export interface TournamentDataError {
  userId: number;
  tournamentId: number;
  error: string;
}

// Union type for all possible broadcast messages (worker ↔ overlays only)
export type BroadcastMessage =
  // Overlay to Worker
  | { type: 'SUBSCRIBE'; data: SubscribeMessage }

  // Worker to Overlays - Tournament Data Only
  | { type: 'TOURNAMENT_DATA_RESPONSE'; data: TournamentDataResponse }
  | { type: 'TOURNAMENT_DATA_REFRESH'; data: TournamentDataRefresh }
  | { type: 'TOURNAMENT_DATA_INCREMENTAL'; data: TournamentDataIncremental }
  | { type: 'TOURNAMENT_DATA_ERROR'; data: TournamentDataError };