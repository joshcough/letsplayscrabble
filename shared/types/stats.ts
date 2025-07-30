// shared/types/stats.ts
// Computed statistics types (separate from core tournament data)

import * as File from './scrabbleFileFormat';

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
  etc: File.Etc; // Use file format since that's what's stored in DB
  photo: string;
}
