// shared/types/database.ts
// Types that match your database table schemas exactly
import * as File from "./scrabbleFileFormat";

// Full database row types (after insertion)
export interface TournamentRow {
  id: number;
  name: string;
  city: string;
  year: number;
  lexicon: string;
  long_form_name: string;
  created_at: Date;
  updated_at: Date;
  user_id: number;
  poll_until: Date | null; // TODO: doesnt actually live in this table
  data_url: string; // TODO: doesnt actually live in this table.
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
  tournament_id: number;
  division_id: number;
  seed: number;
  name: string;
  initial_rating: number;
  photo: string | null;
  etc_data: File.Etc; // Store original file format as-is
  xtid: number | null; // Cross-tables ID at top level for easy access
  created_at: Date;
  updated_at: Date;
}

// PlayerRow with cross-tables data joined
export interface PlayerRowWithCrossTables extends PlayerRow {
  xt_cross_tables_id?: number | null;
  xt_name?: string | null;
  twl_rating?: number | null;
  csw_rating?: number | null;
  twl_ranking?: number | null;
  csw_ranking?: number | null;
  wins?: number | null;
  losses?: number | null;
  ties?: number | null;
  byes?: number | null;
  photo_url?: string | null;
  xt_city?: string | null;
  xt_state?: string | null;
  xt_country?: string | null;
  tournament_results?: string | null; // JSON string
  tournament_count?: number | null;
  average_score?: number | null;
}

export interface GameRow {
  id: number;
  division_id: number; // Direct reference after migration
  round_number: number; // Direct field after migration
  player1_id: number;
  player2_id: number;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
  pairing_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface GameWithPlayers {
  game: GameRow;
  player1: PlayerRow;
  player2: PlayerRow;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
}

// Types for creating/inserting (before database IDs)
export interface CreateTournamentRow {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  long_form_name: string;
  data_url: string;
  data: File.TournamentData;
  poll_until: Date | null;
  user_id: number;
}

// For creating tournaments - takes file data
export interface CreateTournamentParams {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
  rawData: File.TournamentData;
}

export interface TournamentMetadata {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}

export interface CreateDivisionRow {
  name: string;
  position: number;
}

export interface CreatePlayerRow {
  seed: number; // Division-specific seed (1-8, 1-8, 1-12)
  name: string;
  initial_rating: number;
  photo: string | null;
  etc_data: File.Etc;
  xtid: number | null;
}

export interface CreateGameRow {
  round_number: number;
  player1_seed: number;
  player2_seed: number;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
  pairing_id: number | null;
}

// For creating/inserting - before database IDs are assigned
export interface CreateTournament {
  tournament: CreateTournamentRow;
  divisions: CreateDivisionWithData[];
}

export interface CreateDivisionWithData {
  division: CreateDivisionRow;
  players: CreatePlayerRow[];
  games: CreateGameRow[];
}

export interface Tournament {
  tournament: TournamentRow;
  divisions: {
    division: DivisionRow;
    players: PlayerRowWithCrossTables[];
    games: GameRow[];
  }[];
}

// Interface for tracking game changes
export interface GameChanges {
  added: GameRow[];
  updated: GameRow[];
}

export interface TournamentUpdate {
  tournament: TournamentRow;
  changes: GameChanges;
}
