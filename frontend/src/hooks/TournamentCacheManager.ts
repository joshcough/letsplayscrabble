// TournamentCacheManager.ts - Simple typed cache for tournament data
import { Tournament } from "@shared/types/database";

interface CachedTournament {
  data: Tournament;
  lastUpdated: number;
}

class TournamentCacheManager {
  private static instance: TournamentCacheManager;
  private cache = new Map<string, CachedTournament>();

  private constructor() {}

  static getInstance(): TournamentCacheManager {
    if (!TournamentCacheManager.instance) {
      TournamentCacheManager.instance = new TournamentCacheManager();
    }
    return TournamentCacheManager.instance;
  }

  private getCacheKey(userId: number, tournamentId: number): string {
    return `${userId}:${tournamentId}`;
  }

  // Get cached tournament data
  get(userId: number, tournamentId: number): Tournament | null {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log(`💾 Cache HIT for ${cacheKey}`);
      return cached.data;
    }

    console.log(`💾 Cache MISS for ${cacheKey}`);
    return null;
  }

  // Store complete tournament data
  set(userId: number, tournamentId: number, data: Tournament): void {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    this.cache.set(cacheKey, {
      data: data,
      lastUpdated: Date.now(),
    });
    console.log(`💾 Cached tournament data for ${cacheKey}`);
  }

  // Check if cache has data for specific tournament
  has(userId: number, tournamentId: number): boolean {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    return this.cache.has(cacheKey);
  }

  // Remove cached data (useful for admin panel changes)
  invalidate(userId: number, tournamentId: number): void {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    this.cache.delete(cacheKey);
    console.log(`🗑️ Invalidated cache for ${cacheKey}`);
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear();
    console.log(`🗑️ Cleared entire tournament cache`);
  }

  // Get cache stats for debugging
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Get last updated time for specific tournament
  getLastUpdated(userId: number, tournamentId: number): number | null {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    const cached = this.cache.get(cacheKey);
    return cached?.lastUpdated || null;
  }
}

export default TournamentCacheManager;
