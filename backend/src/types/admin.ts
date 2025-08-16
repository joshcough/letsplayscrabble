// backend/src/types/admin.ts
import { CurrentMatch } from "./currentMatch";

export interface CreateMatchRequest {
  player1Id: number;
  player2Id: number;
  divisionId: number;
  tournamentId: number;
}

export interface GameResult {
  round: number;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
}

export interface PlayerStats {
  playerId: number;
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
  averageScoreRounded: string;
  averageOpponentScore: string;
  averageScoreRank: number;
  averageOpponentScoreRank: number;
  averageScoreRankOrdinal: string;
  averageOpponentScoreRankOrdinal: string;
  highScore: number;
  rank?: number;
  rankOrdinal?: string;
  etc: any; // Keep as any since this is backend specific
  photo: string;
}

export interface MatchWithPlayers {
  matchData: CurrentMatch;
  tournament: {
    name: string;
    lexicon: string;
  };
  players: [PlayerStats, PlayerStats];
  last5: [GameResult[], GameResult[]];
}
