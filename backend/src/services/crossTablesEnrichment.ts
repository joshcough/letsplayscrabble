// Cross-tables player enrichment service for backend
import * as File from "../types/scrabbleFileFormat";
import * as Domain from "@shared/types/domain";

interface CrossTablesPlayer {
  playerid: string;
  name: string;
}

interface CrossTablesPlayerData {
  playerid: number;
  name: string;
  w: number;
  l: number;
  t: number;
  twlrating: number;
  cswrating: number;
  twlranking: number;
  cswranking: number;
  city: string;
  state: string;
  country: string;
  photourl: string;
  averageScore: number;
  opponentAverageScore: number;
  tournamentCount: number;
  results: Domain.TournamentResult[];
}

class CrossTablesEnrichmentService {
  private allPlayersCache: CrossTablesPlayer[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  async enrichSpecificPlayers(playersToEnrich: Array<{ name: string; seed: number }>): Promise<Map<number, number>> {
    console.log(`🔍 CrossTablesEnrichment: Enriching ${playersToEnrich.length} specific players who need xtids...`);
    
    if (playersToEnrich.length === 0) {
      console.log('✅ CrossTablesEnrichment: No players need enrichment');
      return new Map();
    }

    // Fetch all cross-tables players if needed
    const allPlayers = await this.getAllCrossTablesPlayers();
    if (!allPlayers) {
      console.error('❌ CrossTablesEnrichment: Failed to fetch cross-tables player list');
      return new Map();
    }

    console.log(`📋 CrossTablesEnrichment: Loaded ${allPlayers.length} cross-tables players for matching`);

    const enrichedPlayers = new Map<number, number>(); // seed -> xtid
    let matchedCount = 0;
    let duplicateCount = 0;

    // Try to match each player
    for (const { name, seed } of playersToEnrich) {
      const convertedName = this.convertNameFormat(name);
      console.log(`🔄 CrossTablesEnrichment: Converting "${name}" to "${convertedName}"`);
      
      const matches = this.findPlayerMatches(convertedName, allPlayers);
      
      if (matches.length === 0) {
        console.log(`❌ CrossTablesEnrichment: No matches found for "${convertedName}"`);
      } else if (matches.length === 1) {
        const xtid = parseInt(matches[0].playerid);
        enrichedPlayers.set(seed, xtid);
        matchedCount++;
        console.log(`✅ CrossTablesEnrichment: Matched "${convertedName}" (seed ${seed}) to xtid ${xtid}`);
      } else {
        duplicateCount++;
        console.log(`⚠️ CrossTablesEnrichment: Found ${matches.length} matches for "${convertedName}":`, 
          matches.map(m => `${m.name} (ID: ${m.playerid})`));
        
        // Resolve duplicate by fetching detailed data and picking highest rating
        const resolvedXtid = await this.resolveDuplicateByRating(matches);
        if (resolvedXtid) {
          enrichedPlayers.set(seed, resolvedXtid);
          matchedCount++;
          console.log(`🏆 CrossTablesEnrichment: Resolved duplicate for "${convertedName}" (seed ${seed}) to xtid ${resolvedXtid} (highest rating)`);
        } else {
          console.log(`❌ CrossTablesEnrichment: Failed to resolve duplicate for "${convertedName}"`);
        }
      }
    }

    console.log(`🎊 CrossTablesEnrichment: Specific enrichment complete! Matched: ${matchedCount}, Duplicates resolved: ${duplicateCount}, Total requested: ${playersToEnrich.length}`);

    return enrichedPlayers;
  }

  async enrichTournamentWithCrossTablesData(tournamentData: File.TournamentData): Promise<File.TournamentData> {
    console.log('🔍 CrossTablesEnrichment: Checking tournament for missing xtids...');
    
    // Check if any players are missing xtid
    const playersNeedingXtid: { division: string; player: File.Player }[] = [];
    
    for (const [divisionName, division] of Object.entries(tournamentData.divisions)) {
      for (const player of division.players) {
        if (player && !player.etc?.xtid) {
          playersNeedingXtid.push({ division: divisionName, player });
        }
      }
    }

    if (playersNeedingXtid.length === 0) {
      console.log('✅ CrossTablesEnrichment: All players already have xtids, no enrichment needed');
      return tournamentData;
    }

    console.log(`🎯 CrossTablesEnrichment: Found ${playersNeedingXtid.length} players without xtids:`, 
      playersNeedingXtid.map(p => p.player.name));

    // Fetch all cross-tables players if needed
    const allPlayers = await this.getAllCrossTablesPlayers();
    if (!allPlayers) {
      console.error('❌ CrossTablesEnrichment: Failed to fetch cross-tables player list');
      return tournamentData;
    }

    console.log(`📋 CrossTablesEnrichment: Loaded ${allPlayers.length} cross-tables players for matching`);

    // Create a deep copy of tournament data to avoid mutations
    const enrichedTournament = JSON.parse(JSON.stringify(tournamentData));
    let matchedCount = 0;
    let duplicateCount = 0;

    // Try to match each player
    for (const { division: divisionName, player: originalPlayer } of playersNeedingXtid) {
      const division = enrichedTournament.divisions[divisionName];
      const player = division.players.find((p: File.Player) => p && p.id === originalPlayer.id);
      
      if (!player) continue;

      const convertedName = this.convertNameFormat(player.name);
      console.log(`🔄 CrossTablesEnrichment: Converting "${player.name}" to "${convertedName}"`);
      
      const matches = this.findPlayerMatches(convertedName, allPlayers);
      
      if (matches.length === 0) {
        console.log(`❌ CrossTablesEnrichment: No matches found for "${convertedName}"`);
      } else if (matches.length === 1) {
        if (!player.etc) player.etc = {};
        player.etc.xtid = parseInt(matches[0].playerid);
        matchedCount++;
        console.log(`✅ CrossTablesEnrichment: Matched "${convertedName}" to xtid ${matches[0].playerid}`);
      } else {
        duplicateCount++;
        console.log(`⚠️ CrossTablesEnrichment: Found ${matches.length} matches for "${convertedName}":`, 
          matches.map(m => `${m.name} (ID: ${m.playerid})`));
        
        // Resolve duplicate by fetching detailed data and picking highest rating
        const resolvedXtid = await this.resolveDuplicateByRating(matches);
        if (resolvedXtid) {
          if (!player.etc) player.etc = {};
          player.etc.xtid = resolvedXtid;
          matchedCount++;
          console.log(`🏆 CrossTablesEnrichment: Resolved duplicate for "${convertedName}" to xtid ${resolvedXtid} (highest rating)`);
        } else {
          console.log(`❌ CrossTablesEnrichment: Failed to resolve duplicate for "${convertedName}"`);
        }
      }
    }

    console.log(`🎊 CrossTablesEnrichment: Enrichment complete! Matched: ${matchedCount}, Duplicates resolved: ${duplicateCount}, Total missing: ${playersNeedingXtid.length}`);

    return enrichedTournament;
  }

  private async getAllCrossTablesPlayers(): Promise<CrossTablesPlayer[] | null> {
    // Check cache first
    const now = Date.now();
    if (this.allPlayersCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      console.log('📦 CrossTablesEnrichment: Using cached cross-tables players');
      return this.allPlayersCache;
    }

    try {
      console.log('🌐 CrossTablesEnrichment: Fetching all cross-tables players...');
      const response = await fetch('https://cross-tables.com/rest/players.php?idsonly=1');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.players || !Array.isArray(data.players)) {
        throw new Error('Invalid response format');
      }

      this.allPlayersCache = data.players;
      this.cacheTimestamp = now;
      
      console.log(`✅ CrossTablesEnrichment: Fetched ${data.players.length} cross-tables players`);
      return data.players;
    } catch (error) {
      console.error('❌ CrossTablesEnrichment: Failed to fetch cross-tables players:', error);
      return null;
    }
  }

  private convertNameFormat(name: string): string {
    // Convert "Last, First" to "First Last"
    if (name.includes(', ')) {
      const [last, first] = name.split(', ');
      return `${first.trim()} ${last.trim()}`;
    }
    return name; // Already in "First Last" format
  }

  private findPlayerMatches(convertedName: string, allPlayers: CrossTablesPlayer[]): CrossTablesPlayer[] {
    // Exact match first
    const exactMatches = allPlayers.filter(p => p.name === convertedName);
    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // Case-insensitive match
    const caseInsensitiveMatches = allPlayers.filter(
      p => p.name.toLowerCase() === convertedName.toLowerCase()
    );
    return caseInsensitiveMatches;
  }

  private async resolveDuplicateByRating(matches: CrossTablesPlayer[]): Promise<number | null> {
    try {
      console.log(`🔍 CrossTablesEnrichment: Resolving duplicate by fetching ratings for ${matches.length} players...`);
      
      let bestPlayer: { xtid: number; rating: number } | null = null;

      for (const match of matches) {
        try {
          const response = await fetch(`https://cross-tables.com/rest/player.php?p=${match.playerid}`);
          if (!response.ok) continue;

          const playerData: CrossTablesPlayerData = await response.json();
          
          // Use TWL rating first, fall back to CSW rating
          const rating = playerData.twlrating || playerData.cswrating || 0;
          
          console.log(`📊 CrossTablesEnrichment: Player ${match.name} (ID: ${match.playerid}) has rating ${rating}`);
          
          if (!bestPlayer || rating > bestPlayer.rating) {
            bestPlayer = { xtid: parseInt(match.playerid), rating };
          }
        } catch (error) {
          console.error(`❌ CrossTablesEnrichment: Failed to fetch rating for player ${match.playerid}:`, error);
        }
      }

      return bestPlayer?.xtid || null;
    } catch (error) {
      console.error('❌ CrossTablesEnrichment: Failed to resolve duplicate by rating:', error);
      return null;
    }
  }
}

// Singleton instance
export const crossTablesEnrichment = new CrossTablesEnrichmentService();