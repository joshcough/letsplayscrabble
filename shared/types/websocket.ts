// shared/types/websocket.ts - WebSocket messages from server to worker

import * as Domain from "./domain";

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
  userId: number;
  tournamentId: number;
  update: Domain.TournamentUpdate;
}

export interface Ping extends WebSocketMessage {
  messageId: number;
}

export interface TournamentThemeChangedMessage extends WebSocketMessage {
  tournamentId: number;
  theme: string;
  tournamentName: string;
  userId: number;
}

// Union type for all possible WebSocket messages from server
export type WebSocketMessageType =
  | { type: 'Ping'; data: Ping }
  | { type: 'TournamentThemeChanged'; data: TournamentThemeChangedMessage }
  | { type: 'AdminPanelUpdate'; data: AdminPanelUpdateMessage }
  | { type: 'GamesAdded'; data: GamesAddedMessage };