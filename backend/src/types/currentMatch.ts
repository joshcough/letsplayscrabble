export interface CurrentMatch {
  id: number;
  player1_id: number;
  player2_id: number;
  division_id: number;
  tournament_id: number;
}

export interface CreateCurrentMatchParams {
  player1Id: number;
  player2Id: number;
  divisionId: number;
  tournamentId: number;
}