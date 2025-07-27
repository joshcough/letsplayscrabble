// shared/types/admin.ts
import { CurrentMatch } from "./currentMatch";
import { PlayerStats } from "./stats";

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

export interface MatchWithPlayers {
  matchData: CurrentMatch;
  tournament: {
    name: string;
    lexicon: string;
  };
  players: [PlayerStats, PlayerStats];
  last5: [GameResult[], GameResult[]];
}
