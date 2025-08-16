// shared/types/scrabbleFileFormat.ts
// Types for data that comes from downloaded tournament files

export interface TournamentData {
  divisions: Division[];
}

export interface Division {
  name: string;
  players: (Player | null)[];
}

export interface Player {
  id: number; // player_id in the file
  name: string;
  scores: number[];
  pairings: number[];
  rating: number; // initial rating
  etc: Etc;
  photo: string;
}

export interface Etc {
  newr: number[]; // Player ratings history
  p12: number[]; // 1 = player goes first, 2 = opponent goes first, 0 = bye
}
