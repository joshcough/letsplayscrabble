import { CrossTablesPlayer, DetailedCrossTablesPlayer } from '@shared/types/domain';
import { CrossTablesClient } from './crossTablesClient';
import { CrossTablesPlayerRepository } from '../repositories/crossTablesPlayerRepository';
import { TournamentRepository } from '../repositories/tournamentRepository';
import { TournamentData } from '../types/scrabbleFileFormat';
import { extractXtidFromEtc, stripXtidFromPlayerName } from '../utils/xtidHelpers';

export class CrossTablesSyncService {
  constructor(
    private readonly repo: CrossTablesPlayerRepository,
    private readonly tournamentRepo?: TournamentRepository
  ) {}

  /**
   * Syncs cross-tables player data for all players in a tournament
   *
   * Optimized approach:
   * 1. Separates players with embedded xtids from players without xtids
   * 2. For players without xtids: uses bulk CrossTables lookup to find their IDs by name
   * 3. Only fetches full profile data for newly discovered xtids (avoids redundant API calls)
   * 4. Stores fetched data in cross_tables_players table for future overlay use
   * 5. Optionally fetches detailed tournament history for enhanced overlays
   *
   * This allows OBS overlays to join tournament players with rich cross-tables data
   * without making unnecessary API calls for players whose xtids we already have.
   *
   * Returns: Map of division names to arrays of xtids for that division
   *
   * Called when:
   * - New tournament is created
   * - Tournament file is manually updated
   * - Polling service detects tournament changes
   */
  async syncPlayersFromTournament(tournamentData: TournamentData, includeDetailedData: boolean = false): Promise<Map<string, number[]>> {
    console.log('🔄 Starting optimized cross-tables player sync for tournament...');

    // Step 1: Analyze tournament data to separate embedded vs. missing xtids by division
    const analysis = this.analyzeTournamentPlayers(tournamentData);

    const totalEmbeddedXtids = Array.from(analysis.divisionXtids.values()).flat().length;
    if (totalEmbeddedXtids === 0 && analysis.playersWithoutXtids.length === 0) {
      console.log('✅ No players need cross-tables sync');
      return new Map<string, number[]>();
    }

    console.log(`📊 Tournament analysis: ${totalEmbeddedXtids} embedded xtids across ${analysis.divisionXtids.size} divisions, ${analysis.playersWithoutXtids.length} players without xtids`);

    // Step 2: For players without embedded xtids, discover their xtids via bulk lookup
    const discoveredXtidsByDivision = new Map<string, number[]>();
    if (analysis.playersWithoutXtids.length > 0) {
      console.log('🔍 Looking up xtids for players without embedded data...');
      const discoveredXtids = await this.discoverXtidsForPlayersWithDivisions(analysis.playersWithoutXtids);

      // Merge discovered xtids into division map
      for (const [divisionName, xtids] of discoveredXtids) {
        discoveredXtidsByDivision.set(divisionName, xtids);
      }

      const totalDiscovered = Array.from(discoveredXtids.values()).flat().length;
      console.log(`✅ Discovered ${totalDiscovered} additional xtids from name matching`);
    }

    // Step 3: Merge embedded and discovered xtids by division
    const allDivisionXtids = new Map<string, number[]>();
    for (const [divisionName, embeddedXtids] of analysis.divisionXtids) {
      const discovered = discoveredXtidsByDivision.get(divisionName) || [];
      allDivisionXtids.set(divisionName, [...embeddedXtids, ...discovered]);
    }

    // Add any divisions that only had discovered xtids
    for (const [divisionName, discoveredXtids] of discoveredXtidsByDivision) {
      if (!allDivisionXtids.has(divisionName)) {
        allDivisionXtids.set(divisionName, discoveredXtids);
      }
    }

    // Get all unique xtids for profile fetching
    const allUniqueXtids = Array.from(new Set(Array.from(allDivisionXtids.values()).flat()));

    if (allUniqueXtids.length === 0) {
      console.log('⚠️ No cross-tables IDs found after lookup');
      return new Map<string, number[]>();
    }

    console.log(`🎯 Total unique xtids for sync: ${allUniqueXtids.length} across ${allDivisionXtids.size} divisions`);
    for (const [divisionName, xtids] of allDivisionXtids) {
      console.log(`  📁 Division "${divisionName}": ${xtids.length} players`);
    }

    // Step 4: Only fetch profile data for xtids we haven't processed before
    await this.ensureGlobalPlayersExist(allUniqueXtids);

    // Step 5: Optionally fetch detailed tournament history
    if (includeDetailedData) {
      console.log('📈 Fetching detailed tournament history for enhanced overlays...');
      await this.syncDetailedPlayerData(allUniqueXtids);
    }

    console.log('✅ Optimized cross-tables player sync completed');
    return allDivisionXtids;
  }

  async ensureGlobalPlayersExist(crossTablesIds: number[]): Promise<void> {
    if (crossTablesIds.length === 0) return;
    
    try {
      // Always update all players (simple approach - one batch call per tournament)
      console.log(`Updating cross-tables data for ${crossTablesIds.length} players: ${crossTablesIds.join(', ')}`);
      await this.fetchAndStorePlayerData(crossTablesIds);
      console.log('Cross-tables basic sync completed');
    } catch (error) {
      console.error('ERROR in ensureGlobalPlayersExist:', error);
      throw error;
    }
  }

  private analyzeTournamentPlayers(tournamentData: TournamentData): {
    divisionXtids: Map<string, number[]>;
    playersWithoutXtids: { name: string; cleanName: string; divisionName: string }[];
  } {
    const divisionXtids = new Map<string, number[]>();
    const playersWithoutXtids: { name: string; cleanName: string; divisionName: string }[] = [];

    for (const division of tournamentData.divisions) {
      const divisionXtidList: number[] = [];

      for (const player of division.players) {
        if (!player) continue;

        const xtid = extractXtidFromEtc(player.etc?.xtid);
        if (xtid !== null) {
          // Player has embedded xtid
          divisionXtidList.push(xtid);
          console.log(`📌 Found embedded xtid ${xtid} for player "${player.name}" in division "${division.name}"`);
        } else {
          // Player needs xtid lookup by name
          const cleanName = stripXtidFromPlayerName(player.name);
          playersWithoutXtids.push({ name: player.name, cleanName, divisionName: division.name });
          console.log(`🔍 Player "${player.name}" in division "${division.name}" needs xtid lookup`);
        }
      }

      if (divisionXtidList.length > 0) {
        divisionXtids.set(division.name, divisionXtidList);
      }
    }

    return {
      divisionXtids,
      playersWithoutXtids
    };
  }

  private async discoverXtidsForPlayersWithDivisions(players: { name: string; cleanName: string; divisionName: string }[]): Promise<Map<string, number[]>> {
    console.log(`🔍 Looking up ${players.length} players individually via CrossTables search API...`);

    try {
      const discoveredXtidsByDivision = new Map<string, number[]>();

      for (const { name, cleanName, divisionName } of players) {
        // Convert name format: "Last, First" → "First Last"
        const convertedName = this.convertNameFormat(cleanName);
        console.log(`🔍 Searching CrossTables for "${convertedName}" in division "${divisionName}"`);

        // Use individual search instead of loading all players (which only returns first 200)
        const matches = await CrossTablesClient.searchPlayers(convertedName);

        if (matches.length === 1) {
          const xtid = matches[0].playerid; // Already a number, no need to parse

          // Add to division's xtid list
          const divisionXtids = discoveredXtidsByDivision.get(divisionName) || [];
          divisionXtids.push(xtid);
          discoveredXtidsByDivision.set(divisionName, divisionXtids);

          console.log(`✅ Found "${convertedName}" -> xtid ${xtid} in division "${divisionName}"`);
        } else if (matches.length === 0) {
          console.log(`❌ No CrossTables match for "${convertedName}" in division "${divisionName}"`);
        } else {
          console.log(`⚠️ Found ${matches.length} matches for "${convertedName}" in division "${divisionName}" - skipping ambiguous match`);
        }
      }

      console.log(`✅ Discovered ${Array.from(discoveredXtidsByDivision.values()).flat().length} xtids via individual searches`);
      return discoveredXtidsByDivision;
    } catch (error) {
      console.error('❌ Failed to discover xtids:', error);
      return new Map<string, number[]>();
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

  private findPlayerMatches(convertedName: string, allPlayers: {playerid: string, name: string}[]): {playerid: string, name: string}[] {
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

  private async fetchAndStorePlayerData(playerIds: number[]): Promise<void> {
    const batchSize = 50; // Cross-tables API may have rate limits
    const batches = this.chunkArray(playerIds, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} players)`);

      try {
        // Try batch fetch first (more efficient)
        const players = await CrossTablesClient.getPlayers(batch);

        if (players.length > 0) {
          await this.repo.upsertPlayers(players);
          console.log(`Stored ${players.length} players from batch`);

          // Check if batch API silently dropped some players (CrossTables API bug)
          if (players.length < batch.length) {
            const fetchedIds = new Set(players.map(p => p.playerid));
            const missingIds = batch.filter(id => !fetchedIds.has(id));
            console.log(`⚠️  Batch API only returned ${players.length}/${batch.length} players, fetching ${missingIds.length} missing individually`);
            await this.fetchPlayersIndividually(missingIds);
          }
        } else {
          // If batch fetch returns no data, try individual fetches
          console.log(`Batch fetch returned no players, fetching ${batch.length} individually`);
          await this.fetchPlayersIndividually(batch);
        }
      } catch (error) {
        console.error(`Batch fetch failed for batch ${i + 1}, trying individual fetches:`, error);
        await this.fetchPlayersIndividually(batch);
      }

      // Add delay between batches to be respectful to the API
      if (i < batches.length - 1) {
        await this.delay(1000); // 1 second delay
      }
    }
  }

  private async fetchPlayersIndividually(playerIds: number[]): Promise<void> {
    for (const playerId of playerIds) {
      try {
        const player = await CrossTablesClient.getPlayer(playerId);
        if (player) {
          await this.repo.upsertPlayer(player);
          console.log(`Stored individual player: ${player.name} (ID: ${playerId})`);
        } else {
          console.warn(`No data found for player ID: ${playerId}`);
        }
      } catch (error) {
        console.error(`Failed to fetch individual player ${playerId}:`, error);
      }
      
      // Small delay between individual requests
      await this.delay(200);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Updates tournament player records with their CrossTables IDs after sync
   * This enables the API to join players with their CrossTables data for overlays
   */
  async updateTournamentPlayerXtids(tournamentId: number, tournamentData: TournamentData): Promise<void> {
    if (!this.tournamentRepo) {
      console.log('No tournament repository available, skipping player xtid updates');
      return;
    }

    console.log(`🔗 CrossTablesSync: Updating player xtids for tournament ${tournamentId}...`);
    
    // Build a map of name -> xtid by looking up players by name in cross_tables_players
    const nameToXtidMap = new Map<string, number>();
    
    for (const division of tournamentData.divisions) {
      for (const player of division.players) {
        if (player?.name && player.id) {
          // Strip :XT suffix from name before lookup (tournament generator adds these for testing)
          const cleanName = stripXtidFromPlayerName(player.name);

          // Look up the player by clean name in cross_tables_players to get the correct xtid
          const crossTablesPlayer = await this.repo.findByName(cleanName);
          if (crossTablesPlayer) {
            // Use clean name as key since that's what's stored in the database
            nameToXtidMap.set(cleanName, crossTablesPlayer.cross_tables_id);
            console.log(`🔗 Mapped ${cleanName} (seed ${player.id}) -> xtid ${crossTablesPlayer.cross_tables_id}`);
          } else {
            console.log(`⚠️  No CrossTables data found for ${cleanName} (seed ${player.id})`);
          }
        }
      }
    }
    
    if (nameToXtidMap.size === 0) {
      console.log('No players with CrossTables data found, skipping updates');
      return;
    }
    
    console.log(`🔗 CrossTablesSync: Found ${nameToXtidMap.size} players with xtids to update`);
    
    // Update the tournament player records with their xtids
    await this.tournamentRepo.updatePlayersWithXtidsByName(tournamentId, nameToXtidMap);
    
    console.log(`✅ CrossTablesSync: Updated tournament ${tournamentId} player xtids`);
  }

  async syncSpecificPlayers(playerIds: number[]): Promise<void> {
    console.log(`Syncing specific players: ${playerIds.join(', ')}`);
    await this.fetchAndStorePlayerData(playerIds);
  }

  async syncTournamentWithCrossTablesData(tournamentData: TournamentData): Promise<TournamentData> {
    // This method provides the same interface as the old enrichment service
    // but uses the new sync approach. For now, just return the data as-is
    // since the sync happens in the background via syncPlayersFromTournament
    console.log('CrossTables sync: syncTournamentWithCrossTablesData called (no-op - sync handled separately)');
    return tournamentData;
  }

  async syncDetailedPlayerData(playerIds: number[]): Promise<void> {
    console.log(`Syncing detailed data for ${playerIds.length} players...`);
    
    // Fetch detailed data one by one since the API endpoint takes single player ID
    for (const playerId of playerIds) {
      try {
        console.log(`Fetching detailed data for player ${playerId}...`);
        const detailedPlayer = await CrossTablesClient.getDetailedPlayer(playerId);
        
        if (detailedPlayer) {
          console.log(`Successfully fetched detailed data for ${detailedPlayer.name} (${detailedPlayer.results?.length || 0} tournaments)`);
          // Ensure the playerid is set since the detailed API might not return it
          detailedPlayer.playerid = playerId;
          await this.repo.upsertDetailedPlayer(detailedPlayer);
        } else {
          console.log(`No detailed data returned for player ${playerId}`);
        }
      } catch (error) {
        console.error(`Error fetching detailed data for player ${playerId}:`, error);
        // Continue with other players
      }
      
      // Add delay between requests to be respectful to the API
      await this.delay(500); // 0.5 second delay
    }
  }
}

// Global export for compatibility with loadTournamentFile
export const crossTablesSync = new CrossTablesSyncService(
  new (require('../repositories/crossTablesPlayerRepository').CrossTablesPlayerRepository)()
);