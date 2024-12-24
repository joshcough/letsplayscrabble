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
  players: (RawPlayer | null)[];
}

export interface RawPlayer {
  id: number;
  name: string;
  scores: number[];
  pairings: number[];
  rating: number;
  etc: {
    newr: number[]; // Player ratings history
    p12: number[]; // 1 = player goes first, 2 = opponent goes first, 0 = bye
  };
}

export interface PlayerData {
  id: number;
  name: string;
  firstLast: string;
}

export interface Pairing {
  round: number;
  player1: PlayerData;
  player2: PlayerData;
}

export interface RoundPairings {
  round: number;
  divisionName: string;
  pairings: Pairing[];
}

export interface PlayerStats {
  id: number;
  name: string;
  firstLast: string;
  initialRating: number;
  currentRating: number;
  ratingDiff: number;
  seed: number;
  seedOrdinal: string;
  wins: number;
  losses: number;
  ties: number;
  spread: number;
  averageScore: number;
  averageScoreRounded: string; // this is a string because its rounded to two decimal places
  averageOpponentScore: string;
  averageScoreRank: number;
  averageOpponentScoreRank: number;
  averageScoreRankOrdinal: string;
  averageOpponentScoreRankOrdinal: string;
  highScore: number;
  rank?: number;
  rankOrdinal?: string;
}

export interface GameResult {
  round: number;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
}

export interface ProcessedTournament extends Omit<Tournament, "data"> {
  divisions: Division[];
  standings: PlayerStats[][]; // a PlayerStats[] per division.
  divisionPairings: RoundPairings[][]; // a RoundsPairing[] per division
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
