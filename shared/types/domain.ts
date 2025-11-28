// shared/types/domain.ts
// Pure domain model types - business logic, no persistence concerns

/**
 * Cross-tables.com player data
 * External API data structure for player ratings and statistics
 */
export interface CrossTablesPlayer {
  playerid: number;
  name: string;
  twlrating?: number;
  cswrating?: number;
  twlranking?: number;
  cswranking?: number;
  w?: number; // wins
  l?: number; // losses  
  t?: number; // ties
  b?: number; // byes
  photourl?: string;
  city?: string;
  state?: string;
  country?: string;
  // Enhanced data from detailed API
  tournamentCount?: number;
  averageScore?: number;
  opponentAverageScore?: number;
  results?: TournamentResult[]; // Full tournament history
}

/**
 * Tournament result from cross-tables.com player.php endpoint
 */
export interface TournamentResult {
  tourneyid: number;
  name: string;
  date: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  place: number;
  totalplayers: number;
  rating: number;
  ratingchange: number;
  points: number;
  averagepoints: number;
}

/**
 * Head-to-head game record from cross-tables.com
 * Individual game between two players with full details
 */
export interface HeadToHeadGame {
  gameid: number;
  date: string;
  tourneyname?: string; // Tournament name from cross-tables
  player1: {
    playerid: number;
    name: string;
    score: number;
    oldrating: number;
    newrating: number;
    position?: number;
  };
  player2: {
    playerid: number;
    name: string;
    score: number;
    oldrating: number;
    newrating: number;
    position?: number;
  };
  annotated?: string; // URL to game replay
}

/**
 * Head-to-head record between two specific players
 * Contains all historical games between them
 */
export interface HeadToHeadRecord {
  player1Id: number;
  player2Id: number;
  games: HeadToHeadGame[];
  // Computed summary stats
  player1Wins: number;
  player2Wins: number;
  ties: number;
  totalGames: number;
  lastMeeting?: HeadToHeadGame;
}

/**
 * Detailed player data with tournament results
 */
export interface DetailedCrossTablesPlayer extends CrossTablesPlayer {
  results?: TournamentResult[];
}

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
  pollUntil: Date | null; // When polling expires (for admin monitoring)
  theme: string; // Theme name for this tournament (should be defaulted)
  transparentBackground: boolean; // Use transparent background for overlays (for OBS)
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
  theme: string; // Theme name for this tournament
  transparentBackground: boolean; // Use transparent background for overlays (for OBS)
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
  headToHeadGames: HeadToHeadGame[]; // Historical cross-tables H2H games for this division
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
  xtid: number | null; // Cross-tables ID for lookup
  xtData: CrossTablesPlayer | null; // Full cross-tables data when available
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
  tournament: TournamentSummary;  // Updated tournament metadata only
  changes: GameChanges;           // Domain-level game changes
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

/**
 * Division-scoped data (what frontend components receive)
 * Contains tournament metadata and a single division's data
 */
export interface DivisionScopedData {
  tournament: TournamentSummary;
  division: Division;
}