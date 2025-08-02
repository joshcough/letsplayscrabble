import { CurrentMatch } from "./currentMatch";
import { Tournament, TournamentUpdate } from "./database";

export interface WebSocketMessage {
  timestamp: number;
}

export interface AdminPanelUpdateMessage extends WebSocketMessage {
  userId: number;
  tournamentId: number;
  divisionId: number;
  divisionName: string;
  round: number;
  pairingId: number;
}

export interface GamesAddedMessage extends WebSocketMessage {
  update: DB.TournamentUpdate;
}

export interface Ping extends WebSocketMessage {
  messageId: number;
}

export interface TournamentDataMessage {
  userId: number;
  tournamentId: number;
  data: Tournament;
}

export interface TournamentDataErrorMessage {
  userId: number;
  tournamentId: number;
  error: string;
}

// Union type for all possible broadcast messages
export type BroadcastMessage =
  | { type: 'Ping'; data: Ping }
  | { type: 'AdminPanelUpdate'; data: AdminPanelUpdateMessage }
  | { type: 'GamesAdded'; data: GamesAddedMessage }
  | { type: 'TOURNAMENT_DATA'; data: TournamentDataMessage }
  | { type: 'TOURNAMENT_DATA_ERROR'; data: TournamentDataErrorMessage };