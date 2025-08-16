// shared/types/persistence.ts
// Database row types - exactly match database tables

import * as File from './scrabbleFileFormat';

// ============================================================================
// DATABASE ROW TYPES (persistence layer)
// ============================================================================

export interface TournamentRow {
  id: number;
  name: string;
  city: string;
  year: number;
  lexicon: string;
  long_form_name: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  // DEPRECATED: These fields were moved to tournament_data table
  // TODO: Remove these after updating all code to use proper joins
  /** @deprecated Use TournamentDataRow.poll_until instead */
  poll_until?: Date | null;
  /** @deprecated Use TournamentDataRow.data_url instead */
  data_url?: string;
}

export interface TournamentDataRow {
  tournament_id: number;
  data_url: string;
  data: File.TournamentData; // JSON field containing raw tournament data
  poll_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface DivisionRow {
  id: number;
  tournament_id: number;
  name: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface PlayerRow {
  id: number;
  tournament_id: number; // TODO: This is redundant - derivable from division
  division_id: number;
  seed: number;
  name: string;
  initial_rating: number;
  photo: string | null;
  etc_data: File.Etc; // Store original file format as-is
  created_at: Date;
  updated_at: Date;
}

export interface GameRow {
  id: number;
  division_id: number;
  round_number: number;
  player1_id: number;
  player2_id: number;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
  pairing_id: number | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// INSERT TYPES (before database assigns IDs)
// ============================================================================

export interface CreateTournamentRow {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  long_form_name: string;
  user_id: number;
  data_url: string;
  data: import("./scrabbleFileFormat").TournamentData;
  poll_until: Date | null;
}

export interface CreateDivisionRow {
  tournament_id: number;
  name: string;
  position: number;
}

export interface CreatePlayerRow {
  tournament_id: number; // TODO: Remove this redundancy
  division_id: number;
  seed: number;
  name: string;
  initial_rating: number;
  photo: string | null;
  etc_data: File.Etc;
}

export interface CreateGameRow {
  division_id: number;
  round_number: number;
  player1_id: number;
  player2_id: number;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
  pairing_id: number | null;
}