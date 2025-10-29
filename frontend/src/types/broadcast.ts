// frontend/src/types/broadcast.ts - Broadcast channel messages between worker and overlays
import * as Domain from "@shared/types/domain";

// Messages FROM overlays TO worker
export interface SubscribeMessage {
  userId: number;
  tournamentId: number;
  divisionId?: number; // Specify division by ID
  divisionName?: string; // OR specify division by name (worker will resolve)
  // Note: One of divisionId or divisionName must be provided
}

// Tournament metadata (without divisions array - just the tournament info)
export interface TournamentMetadata {
  id: number;
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
  theme?: string;
  transparentBackground?: boolean;
}

// Division-scoped data payload (tournament metadata + single division)
export interface DivisionScopedData {
  tournament: TournamentMetadata;
  division: Domain.Division;
}

// Messages FROM worker TO overlays

// For SUBSCRIBE responses - initial data load
export interface TournamentDataResponse {
  userId: number;
  tournamentId: number;
  divisionId: number; // Now required - we always send a specific division
  data: DivisionScopedData; // Changed from full Tournament to division-scoped
}

// For AdminPanelUpdate - new tournament/division selected
export interface TournamentDataRefresh {
  userId: number;
  tournamentId: number;
  divisionId: number; // Now required
  data: DivisionScopedData; // Changed from full Tournament to division-scoped
  reason: "admin_panel_update";
}

// For GamesAdded - incremental changes with change metadata
export interface TournamentDataIncremental {
  userId: number;
  tournamentId: number;
  divisionId: number; // Now required
  data: DivisionScopedData; // Changed from full Tournament to division-scoped

  // TODO: previousData was removed to reduce broadcast message size by ~50%
  // It was only used by notification detectors (HighScore needed previous high score)
  // When implementing notifications, either:
  // 1. Pre-calculate needed values (e.g., previousHighScore) in worker and add to metadata
  // 2. Or re-enable previousData just for notification overlay pages
  // previousData?: DivisionScopedData;

  changes: Domain.GameChanges;
  affectedDivisions: number[]; // Keep for notifications that care about multiple divisions
  metadata: {
    addedCount: number;
    updatedCount: number;
    timestamp: number;
    // TODO: Add pre-calculated notification metadata here when implementing notifications
    // e.g., previousHighScore?: number;
  };
  reason: "games_added";
}

// Error handling
export interface TournamentDataError {
  userId: number;
  tournamentId: number;
  error: string;
}

export interface WorkerStatusUpdate {
  status: string;
  error: string | null;
  lastDataUpdate: number;
}

export interface AdminPanelUpdate {
  userId: number;
  tournamentId: number;
  divisionId: number;
  divisionName: string;
  round: number;
  pairingId: number;
}

export interface CacheCleared {
  clearedBy: number;
  timestamp: number;
}

// Add to BroadcastMessage union
export type BroadcastMessage =
  // Overlay to Worker
  | { type: "SUBSCRIBE"; data: SubscribeMessage }

  // Worker to Overlays - Tournament Data
  | { type: "TOURNAMENT_DATA_RESPONSE"; data: TournamentDataResponse }
  | { type: "TOURNAMENT_DATA_REFRESH"; data: TournamentDataRefresh }
  | { type: "TOURNAMENT_DATA_INCREMENTAL"; data: TournamentDataIncremental }
  | { type: "TOURNAMENT_DATA_ERROR"; data: TournamentDataError }
  | { type: "ADMIN_PANEL_UPDATE"; data: AdminPanelUpdate }
  | { type: "CACHE_CLEARED"; data: CacheCleared }

  // Worker to WorkerPage - Status Updates
  | { type: "WORKER_STATUS_UPDATE"; data: WorkerStatusUpdate };
