import { CurrentMatch } from "./currentMatch";
import { Tournament } from "./database";

// WebSocket broadcast message types with user context
export interface AdminPanelUpdateMessage extends CurrentMatch {
  userId: number;
}

export interface GamesAddedMessage {
  userId: number;
  tournamentId: number;
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
  | { type: 'AdminPanelUpdate'; data: AdminPanelUpdateMessage }
  | { type: 'GamesAdded'; data: GamesAddedMessage }
  | { type: 'TOURNAMENT_DATA'; data: TournamentDataMessage }
  | { type: 'TOURNAMENT_DATA_ERROR'; data: TournamentDataErrorMessage };