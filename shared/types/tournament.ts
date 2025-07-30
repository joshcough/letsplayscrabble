// shared/types/tournament.ts
// THIS FILE IS SLATED FOR DEATH AND WE SHOULD NOT USE IT.

export interface GameResult {
  round: number;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
}

export interface CreateTournamentParams {
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
}
