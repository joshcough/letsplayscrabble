// TournamentCacheManager.ts - Enhanced cache with incremental update support
import * as Domain from "@shared/types/domain";

interface CachedTournament {
  data: Domain.Tournament;
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
  get(userId: number, tournamentId: number): Domain.Tournament | null {
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
  set(userId: number, tournamentId: number, data: Domain.Tournament): void {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    this.cache.set(cacheKey, {
      data: data,
      lastUpdated: Date.now(),
    });
    console.log(`💾 Cached tournament data for ${cacheKey}`);
  }

  // Apply incremental game changes to cached tournament
  applyGameChanges(
    userId: number,
    tournamentId: number,
    changes: Domain.GameChanges,
  ): boolean {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      console.log(`💾 Cannot apply changes - no cached data for ${cacheKey}`);
      return false;
    }

    console.log(`💾 🔄 Applying game changes to ${cacheKey}:`, {
      added: changes.added.length,
      updated: changes.updated.length,
    });

    let changeCount = 0;

    // Apply added games
    for (const addedGame of changes.added) {
      // Find the division that contains a player from this game
      const targetDivision = cached.data.divisions.find((div) =>
        div.players.some(
          (p) => p.id === addedGame.player1Id || p.id === addedGame.player2Id,
        ),
      );

      if (targetDivision) {
        const beforeCount = targetDivision.games.length;
        targetDivision.games.push(addedGame);
        changeCount++;
        console.log(
          `💾 ✅ Added game ${addedGame.id} to division ${targetDivision.id} (${beforeCount} → ${targetDivision.games.length} games)`,
        );
      } else {
        console.warn(
          `💾 ❌ Could not find division for added game ${addedGame.id} with players ${addedGame.player1Id}, ${addedGame.player2Id}`,
        );
      }
    }

    // Apply updated games
    for (const updatedGame of changes.updated) {
      // Find the division that contains this game
      let targetDivision: Domain.Division | undefined;
      let gameIndex = -1;

      for (const division of cached.data.divisions) {
        gameIndex = division.games.findIndex(
          (game) => game.id === updatedGame.id,
        );
        if (gameIndex !== -1) {
          targetDivision = division;
          break;
        }
      }

      if (targetDivision && gameIndex !== -1) {
        const oldGame = targetDivision.games[gameIndex];
        targetDivision.games[gameIndex] = updatedGame;
        changeCount++;
        console.log(
          `💾 ✅ Updated game ${updatedGame.id} in division ${targetDivision.id}:`,
          {
            scores: `${oldGame.player1Score}-${oldGame.player2Score} → ${updatedGame.player1Score}-${updatedGame.player2Score}`,
          },
        );
      } else {
        console.warn(`💾 ❌ Could not find game ${updatedGame.id} to update`);
      }
    }

    // Update cache timestamp
    const oldTimestamp = cached.lastUpdated;
    cached.lastUpdated = Date.now();

    console.log(
      `💾 🎯 Applied ${changeCount} game changes to ${cacheKey} (cache age: ${Date.now() - oldTimestamp}ms)`,
    );
    return changeCount > 0;
  }

  // Apply a complete tournament update (includes tournament metadata + game changes)
  applyTournamentUpdate(
    userId: number,
    tournamentId: number,
    update: Domain.TournamentUpdate,
  ): boolean {
    const cacheKey = this.getCacheKey(userId, tournamentId);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      console.log(
        `💾 🔄 Cannot apply tournament update - no cached data for ${cacheKey}`,
      );
      return false;
    }

    console.log(`💾 🔄 Applying tournament update to ${cacheKey}:`, {
      tournamentName: update.tournament.name,
      changes: this.getChangesSummary(update.changes),
    });

    // Update tournament metadata (domain model has flat structure)
    const oldTournamentName = cached.data.name;
    cached.data.name = update.tournament.name;
    cached.data.city = update.tournament.city;
    cached.data.year = update.tournament.year;
    cached.data.lexicon = update.tournament.lexicon;
    cached.data.longFormName = update.tournament.longFormName;

    if (oldTournamentName !== update.tournament.name) {
      console.log(
        `💾 📝 Updated tournament metadata: "${oldTournamentName}" → "${update.tournament.name}"`,
      );
    }

    // Apply game changes
    const success = this.applyGameChanges(userId, tournamentId, update.changes);

    if (success) {
      console.log(
        `💾 ✅ Tournament update applied successfully to ${cacheKey}`,
      );
    } else {
      console.log(
        `💾 ⚠️ Tournament update completed but no game changes applied to ${cacheKey}`,
      );
    }

    return success;
  }

  // Get list of affected division IDs from game changes
  getAffectedDivisions(changes: Domain.GameChanges): number[] {
    const divisionIds = new Set<number>();

    // For domain changes, we need to find which divisions contain the affected games
    const allGames = [...changes.added, ...changes.updated];

    // We need access to cached data to determine division membership
    for (const [cacheKey, cached] of this.cache.entries()) {
      for (const division of cached.data.divisions) {
        for (const game of allGames) {
          if (
            division.players.some(
              (p) => p.id === game.player1Id || p.id === game.player2Id,
            )
          ) {
            divisionIds.add(division.id);
          }
        }
      }
    }

    const result = Array.from(divisionIds);
    console.log(
      `💾 🎯 Affected divisions: [${result.join(", ")}] from ${changes.added.length + changes.updated.length} game changes`,
    );

    return result;
  }

  // Check if specific division is affected by changes
  isDivisionAffected(divisionId: number, changes: Domain.GameChanges): boolean {
    const affectedDivisions = this.getAffectedDivisions(changes);
    return affectedDivisions.includes(divisionId);
  }

  // Get change summary for logging/debugging
  getChangesSummary(changes: Domain.GameChanges): string {
    const addedCount = changes.added.length;
    const updatedCount = changes.updated.length;
    const affectedDivisions = this.getAffectedDivisions(changes);

    return `${addedCount} added, ${updatedCount} updated games affecting divisions: [${affectedDivisions.join(", ")}]`;
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

  // Get cached tournament with change validation
  getWithValidation(
    userId: number,
    tournamentId: number,
  ): {
    tournament: Domain.Tournament | null;
    isStale: boolean;
    age: number;
  } {
    const tournament = this.get(userId, tournamentId);
    const lastUpdated = this.getLastUpdated(userId, tournamentId);
    const age = lastUpdated ? Date.now() - lastUpdated : 0;
    const isStale = age > 300000; // 5 minutes

    return {
      tournament,
      isStale,
      age,
    };
  }
}

export default TournamentCacheManager;
