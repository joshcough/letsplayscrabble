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

export interface Etc {
    newr: number[]; // Player ratings history
    p12: number[]; // 1 = player goes first, 2 = opponent goes first, 0 = bye
    firstname1: string[];
    firstname2: string[];
    lastname1: string[];
    lastname2: string[];
    grade1: number[];
    grade2: number[];
    hometown1: string[];
    hometown2: string[];
    schoolname1: string[];
    schoolname2: string[];
    state1: string[];
    state2: string[];
    teamname: string[];
}

export interface RawPlayer {
  id: number;
  name: string;
  scores: number[];
  pairings: number[];
  rating: number;
  etc: Etc;
  photo: string;
}

export interface PlayerData {
  id: number;
  name: string;
  firstLast: string;
  etc: Etc;
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
  etc: Etc;
  photo: string;
}

export interface GameResult {
  round: number;
  opponentName: string;
  opponentElemName: string;
  opponentHSName: string;
  playerScore: number;
  opponentScore: number;
}

export interface ProcessedPlayer {
  id: number;
  name: string;
  rating: number;
  photo: string;
  etc: Etc;
}

export interface ProcessedDivision {
  name: string;
  players: ProcessedPlayer[];
}

export interface ProcessedTournament extends Omit<Tournament, "data"> {
  divisions: ProcessedDivision[];
  standings: PlayerStats[][]; // a PlayerStats[] per division.
  divisionPairings: RoundPairings[][]; // a RoundsPairing[] per division
  data_url: string;
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

export interface DivisionStats {
  gamesPlayed: number;
  pointsScored: number;
  averageScore: number;
  averageWinningScore: number;
  averageLosingScore: number;
  higherSeedWinPercentage: number;
  goingFirstWinPercentage: number;
}

export interface TournamentStats {
  gamesPlayed: number;
  pointsScored: number;
  averageScore: number;
  averageWinningScore: number;
  averageLosingScore: number;
  higherSeedWinPercentage: number;
  goingFirstWinPercentage: number;
}