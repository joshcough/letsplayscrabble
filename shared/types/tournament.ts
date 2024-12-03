export interface Tournament {
  id: number;
  name: string;
  city: string;
  year: number;
  lexicon: string;
  long_form_name: string;
  data_url: string;
  data: TournamentData;
  created_at: Date;
  updated_at: Date;
  poll_until: Date | null;
}

export interface TournamentData {
  divisions: Division[];
}

export interface Division {
  name: string;
  players: (Player | null)[];
}

export interface Player {
  id: number;
  name: string;
  scores: number[];
  pairings: number[];
  etc: {
    newr: number[]; // Player ratings history
  };
}

export interface PlayerStats {
  id: number;
  name: string;
  rating: number;
  firstLast: string;
  wins: number;
  losses: number;
  ties: number;
  spread: number;
  averageScore: string | number;
  highScore: number;
  rank?: number;
  rankOrdinal?: string;
}

export interface ProcessedTournament extends Omit<Tournament, "data"> {
  divisions: Division[];
  standings: PlayerStats[][];
}

export interface CreateTournamentParams {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
  rawData: TournamentData;
}

export interface TwoPlayerStats {
  tournament: {
    name: string;
    lexicon: string;
  };
  player1: PlayerStats;
  player2: PlayerStats;
}
