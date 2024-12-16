export interface CurrentMatch {
  id: number;
  tournament_id: number;
  division_id: number;
  round: number;
  pairing_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCurrentMatchParams {
  tournamentId: number;
  divisionId: number;
  round: number;
  pairingId: number;
}