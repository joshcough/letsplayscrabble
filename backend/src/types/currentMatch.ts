// shared/types/currentMatch.ts

export interface CreateCurrentMatch {
  tournament_id: number;
  division_id: number;
  round: number;
  pairing_id: number;
}

export interface CurrentMatch extends CreateCurrentMatch {
  division_name: string; // Added by JOIN in getCurrentMatch
  updated_at: Date;
}
