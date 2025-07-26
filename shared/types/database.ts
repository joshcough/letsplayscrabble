// shared/types/database.ts
// Types that match your database table schemas exactly

import * as File from './scrabbleFileFormat';

// Full database row types (after insertion)
export interface TournamentRow {
  id: number;
  name: string;
  city: string;
  year: number;
  lexicon: string;
  long_form_name: string;
  data_url: string;
  data: File.TournamentData; // JSON field containing raw tournament data
  created_at: Date;
  updated_at: Date;
  poll_until: Date | null;
  user_id: number;
}

export interface DivisionRow {
  id: number;
  tournament_id: number;
  name: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface TournamentPlayerRow {
  id: number;
  tournament_id: number;
  division_id: number;
  player_id: number; // The ID from the file
  name: string;
  initial_rating: number;
  photo: string | null;
  etc_data: File.Etc; // Store original file format as-is
  created_at: Date;
  updated_at: Date;
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

export interface CreateDivisionRow {
  name: string;
  position: number;
}

export interface CreateTournamentPlayerRow {
  division_position: number; // Reference by position, not ID
  player_id: number;
  name: string;
  initial_rating: number;
  photo: string | null;
  etc_data: File.Etc;
}

export interface CreateGameRow {
  division_position: number;
  round_number: number;
  player1_file_id: number;
  player2_file_id: number;
  player1_score: number | null;
  player2_score: number | null;
  is_bye: boolean;
  pairing_id: number | null;
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

// For creating/inserting - before database IDs are assigned
export interface CreateTournament {
  tournament: CreateTournamentRow;
  divisions: CreateDivisionRow[];
  players: CreateTournamentPlayerRow[];
  games: CreateGameRow[];
}

// For reading/using - complete tournament with actual database records
export interface Tournament {
  tournament: TournamentRow;
  divisions: DivisionRow[];
  players: TournamentPlayerRow[];
  games: GameRow[];
}

export interface UpdateTournamentMetadata {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}