// shared/types/domain.ts
// Pure domain model types - business logic, no persistence concerns

/**
 * Core Tournament domain model
 * Represents the business concept of a tournament
 */
export interface Tournament {
  id: number;
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  divisions: Division[];
}

/**
 * Division domain model  
 * A tournament section with its own players and games
 */
export interface Division {
  id: number;
  name: string;
  players: Player[];
  games: Game[];
}

/**
 * Player domain model
 * A participant in a division
 */
export interface Player {
  id: number;
  seed: number;
  name: string;
  initialRating: number;
  photo: string | null;
  ratingsHistory: number[]; // Player's rating progression throughout tournament
  // Note: no division_id or tournament_id - structure provides context
}

/**
 * Game domain model
 * A match between two players (uses player IDs to avoid object duplication)
 */
export interface Game {
  id: number;
  roundNumber: number;
  player1Id: number;
  player2Id: number;
  player1Score: number | null;
  player2Score: number | null;
  isBye: boolean;
  pairingId: number | null;
}

/**
 * Game result for completed games
 * Convenience type for games with scores
 */
export interface CompletedGame extends Omit<Game, 'player1Score' | 'player2Score'> {
  player1Score: number;
  player2Score: number;
}

/**
 * Player statistics derived from games
 * Computed from game results, not stored
 */
export interface PlayerStats {
  player: Player;
  wins: number;
  losses: number;
  totalGames: number;
  totalPoints: number;
  averagePoints: number;
}