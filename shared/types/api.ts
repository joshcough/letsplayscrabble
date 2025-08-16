// shared/types/api.ts
// API request/response types and WebSocket message types

import * as File from './scrabbleFileFormat';
import { PlayerRow, GameRow, TournamentRow } from './persistence';

// ============================================================================
// HTTP API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request body for creating tournaments from file upload
 */
export interface CreateTournamentRequest {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
  rawData: File.TournamentData;
}

/**
 * Tournament metadata for API responses
 */
export interface TournamentMetadata {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}

/**
 * Game with embedded player data (for admin interface)
 * API response type - not a domain model
 */
export interface GameWithPlayers {
  game: GameRow;
  player1: PlayerRow;
  player2: PlayerRow;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
}

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

/**
 * WebSocket message for incremental game updates
 * Used to efficiently broadcast changes without sending full tournament data
 */
export interface GameChanges {
  added: GameRow[];
  updated: GameRow[];
}

/**
 * WebSocket message for tournament updates
 * Combines metadata changes with game changes
 */
export interface TournamentUpdate {
  tournament: TournamentRow;
  changes: GameChanges;
}

// ============================================================================
// BATCH/FILE PROCESSING TYPES  
// ============================================================================

/**
 * Batch tournament creation (before database IDs)
 * Used when processing tournament files
 */
export interface BatchTournamentCreation {
  tournament: {
    name: string;
    city: string;
    year: number;
    lexicon: string;
    long_form_name: string;
    user_id: number;
    data_url: string;
    data: File.TournamentData;
    poll_until: Date | null;
  };
  divisions: BatchDivisionCreation[];
}

export interface BatchDivisionCreation {
  division: {
    name: string;
    position: number;
  };
  players: {
    seed: number;
    name: string;
    initial_rating: number;
    photo: string | null;
    etc_data: File.Etc;
  }[];
  games: {
    round_number: number;
    player1_seed: number;
    player2_seed: number;
    player1_score: number | null;
    player2_score: number | null;
    is_bye: boolean;
    pairing_id: number | null;
  }[];
}