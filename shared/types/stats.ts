// shared/types/stats.ts
// Computed statistics types (separate from core tournament data)

// Inline Etc type to avoid file format dependency
interface Etc {
  newr: number[]; // Player ratings history
  p12: number[]; // 1 = player goes first, 2 = opponent goes first, 0 = bye
}

export interface PlayerStats {
  playerId: number;
  name: string;
  firstLast: string;
  initialRating: number;
  currentRating: number;
  ratingDiff: number;
  seed: number;
  seedOrdinal: string;
  wins: number;
  losses: number;
  ties: number;
  spread: number;
  averageScore: number;
  averageScoreRounded: string;
  averageOpponentScore: string;
  averageScoreRank: number;
  averageOpponentScoreRank: number;
  averageScoreRankOrdinal: string;
  averageOpponentScoreRankOrdinal: string;
  highScore: number;
  rank?: number;
  rankOrdinal?: string;
  etc: Etc; // Use file format since that's what's stored in DB
  photo: string;
}
