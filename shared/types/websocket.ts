import { CurrentMatch } from "./currentMatch";
import { Tournament } from "./database";

export interface WebSocketMessage {
  messageId: number;
}

// WebSocket broadcast message types with user context
export interface AdminPanelUpdateMessage extends CurrentMatch, WebSocketMessage {
  userId: number;
}

export interface GamesAddedMessage extends WebSocketMessage {
  userId: number;
  tournamentId: number;
}

export interface TournamentDataMessage {
  userId: number;
  tournamentId: number;
  data: Tournament;
}

export interface Ping extends WebSocketMessage{
  timestamp: number;
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