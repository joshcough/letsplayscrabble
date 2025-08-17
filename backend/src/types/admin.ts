// backend/src/types/admin.ts
// Types specifically related to admin panel functionality

export interface CreateMatchRequest {
  player1Id: number;
  player2Id: number;
  divisionId: number;
  tournamentId: number;
}
