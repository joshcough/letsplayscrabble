// shared/types/socket.ts
import { MatchWithPlayers } from "./admin";
import { ProcessedTournament, PlayerStats } from "./tournament";

export type WorkerMessageType =
  | 'connect'
  | 'disconnect'
  | 'connect_error'
  | 'matchUpdate'
  | 'tournamentUpdate'
  | 'error';

export interface WorkerMessage {
  type: WorkerMessageType;
  data?: any;
}

export interface MatchUpdateMessage extends WorkerMessage {
  type: 'matchUpdate';
  data: MatchWithPlayers;
}

export interface TournamentUpdateMessage extends WorkerMessage {
  type: 'tournamentUpdate';
  data: {
    tournament: ProcessedTournament;
    standings: PlayerStats[];
  };
}