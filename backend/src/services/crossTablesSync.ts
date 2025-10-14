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
   * Called when:
   * - New tournament is created
   * - Tournament file is manually updated
   * - Polling service detects tournament changes
   */
  async syncPlayersFromTournament(tournamentData: TournamentData, includeDetailedData: boolean = false): Promise<void> {
    console.log('🔄 Starting optimized cross-tables player sync for tournament...');

    // Step 1: Analyze tournament data to separate embedded vs. missing xtids
    const analysis = this.analyzeTournamentPlayers(tournamentData);

    if (analysis.embeddedXtids.length === 0 && analysis.playersWithoutXtids.length === 0) {
      console.log('✅ No players need cross-tables sync');
      return;
    }

    console.log(`📊 Tournament analysis: ${analysis.embeddedXtids.length} embedded xtids, ${analysis.playersWithoutXtids.length} players without xtids`);

    let allDiscoveredXtids = [...analysis.embeddedXtids];

    // Step 2: For players without embedded xtids, discover their xtids via bulk lookup
    if (analysis.playersWithoutXtids.length > 0) {
      console.log('🔍 Looking up xtids for players without embedded data...');
      const discoveredXtids = await this.discoverXtidsForPlayers(analysis.playersWithoutXtids);
      allDiscoveredXtids.push(...discoveredXtids);
      console.log(`✅ Discovered ${discoveredXtids.length} additional xtids from name matching`);
    }

    if (allDiscoveredXtids.length === 0) {
      console.log('⚠️ No cross-tables IDs found after lookup');
      return;
    }

    console.log(`🎯 Total xtids for sync: ${allDiscoveredXtids.length}`);

    // Step 3: Only fetch profile data for xtids we haven't processed before
    await this.ensureGlobalPlayersExist(allDiscoveredXtids);

    // Step 4: Optionally fetch detailed tournament history
    if (includeDetailedData) {
      console.log('📈 Fetching detailed tournament history for enhanced overlays...');
      await this.syncDetailedPlayerData(allDiscoveredXtids);
    }

    console.log('✅ Optimized cross-tables player sync completed');
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
    embeddedXtids: number[];
    playersWithoutXtids: { name: string; cleanName: string }[];
  } {
    const embeddedXtids = new Set<number>();
    const playersWithoutXtids: { name: string; cleanName: string }[] = [];

    for (const division of tournamentData.divisions) {
      for (const player of division.players) {
        if (!player) continue;

        const xtid = extractXtidFromEtc(player.etc?.xtid);
        if (xtid !== null) {
          // Player has embedded xtid
          embeddedXtids.add(xtid);
          console.log(`📌 Found embedded xtid ${xtid} for player "${player.name}"`);
        } else {
          // Player needs xtid lookup by name
          const cleanName = stripXtidFromPlayerName(player.name);
          playersWithoutXtids.push({ name: player.name, cleanName });
          console.log(`🔍 Player "${player.name}" needs xtid lookup`);
        }
      }
    }

    return {
      embeddedXtids: Array.from(embeddedXtids),
      playersWithoutXtids
    };
  }

  private async discoverXtidsForPlayers(players: { name: string; cleanName: string }[]): Promise<number[]> {
    console.log('🌐 Fetching complete CrossTables player list for name matching...');

    try {
      const allPlayers = await CrossTablesClient.getAllPlayersIdsOnly();
      console.log(`📋 Loaded ${allPlayers.length} players from CrossTables for matching`);

      const discoveredXtids: number[] = [];

      for (const { name, cleanName } of players) {
        // Convert name format: "Last, First" → "First Last"
        const convertedName = this.convertNameFormat(cleanName);
        console.log(`🔄 Converting "${cleanName}" to "${convertedName}" for matching`);

        const matches = this.findPlayerMatches(convertedName, allPlayers);

        if (matches.length === 1) {
          const xtid = parseInt(matches[0].playerid);
          discoveredXtids.push(xtid);
          console.log(`✅ Matched "${convertedName}" to xtid ${xtid}`);
        } else if (matches.length === 0) {
          console.log(`❌ No matches found for "${convertedName}"`);
        } else {
          console.log(`⚠️ Found ${matches.length} matches for "${convertedName}" - skipping ambiguous match`);
        }
      }

      return discoveredXtids;
    } catch (error) {
      console.error('❌ Failed to discover xtids:', error);
      return [];
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
        } else {
          // If batch fetch fails or returns no data, try individual fetches
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
          // Look up the player by name in cross_tables_players to get the correct xtid
          const crossTablesPlayer = await this.repo.findByName(player.name);
          if (crossTablesPlayer) {
            nameToXtidMap.set(player.name, crossTablesPlayer.cross_tables_id);
            console.log(`🔗 Mapped ${player.name} (seed ${player.id}) -> xtid ${crossTablesPlayer.cross_tables_id}`);
          } else {
            console.log(`⚠️  No CrossTables data found for ${player.name} (seed ${player.id})`);
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