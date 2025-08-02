// shared/types/websocket.ts - WebSocket messages from server to worker

import { TournamentUpdate } from "./database";

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
  update: TournamentUpdate;
}

export interface Ping extends WebSocketMessage {
  messageId: number;
}

// Union type for all possible WebSocket messages from server
export type WebSocketMessageType =
  | { type: 'Ping'; data: Ping }
  | { type: 'AdminPanelUpdate'; data: AdminPanelUpdateMessage }
  | { type: 'GamesAdded'; data: GamesAddedMessage };