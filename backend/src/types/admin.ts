import { ProcessedPlayer } from "./tournament";
import { CurrentMatch } from "./currentMatch";

export interface CreateMatchRequest {
  player1Id: number;
  player2Id: number;
  divisionId: number;
  tournamentId: number;
}

export interface MatchWithPlayers {
  matchData: CurrentMatch;
  tournament: {
    name: string;
    lexicon: string;
  };
  players: [ProcessedPlayer | undefined, ProcessedPlayer | undefined];
}
