// shared/types/domain.ts
// Pure domain model types - business logic, no persistence concerns

/**
 * Tournament summary for admin list views
 * Contains only metadata without divisions/games data
 */
export interface TournamentSummary {
  id: number;
  name: string;
  city: string;
  year: number;
  lexicon: string;
  longFormName: string;
  dataUrl: string;
  pollUntil?: Date | null; // When polling expires (for admin monitoring)
}

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
  dataUrl: string;
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

/**
 * Domain-level change types for real-time updates
 * Frontend should only see these, never raw database changes
 */

/**
 * Represents changes to games in domain terms
 */
export interface GameChanges {
  added: Game[];    // New games (already in domain format)
  updated: Game[];  // Updated games (already in domain format)
}

/**
 * Complete tournament update with domain-level changes
 */
export interface TournamentUpdate {
  tournament: Tournament;  // Updated tournament metadata
  changes: GameChanges;    // Domain-level game changes
}

/**
 * Current match being displayed/managed
 * Domain representation focusing on business concepts
 */
export interface CurrentMatch {
  tournamentId: number;
  divisionId: number;
  divisionName: string;
  round: number;
  pairingId: number;
  updatedAt: Date;
}

/**
 * Data needed to create/update a current match
 */
export interface CreateCurrentMatch {
  tournamentId: number;
  divisionId: number;
  round: number;
  pairingId: number;
}