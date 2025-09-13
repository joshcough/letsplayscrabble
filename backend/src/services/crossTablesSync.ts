import { CrossTablesPlayer, DetailedCrossTablesPlayer } from '@shared/types/domain';
import { CrossTablesClient } from './crossTablesClient';
import { CrossTablesPlayerRepository } from '../repositories/crossTablesPlayerRepository';
import { TournamentRepository } from '../repositories/tournamentRepository';
import { TournamentData } from '../types/scrabbleFileFormat';

export class CrossTablesSyncService {
  constructor(
    private readonly repo: CrossTablesPlayerRepository,
    private readonly tournamentRepo?: TournamentRepository
  ) {}

  /**
   * Syncs cross-tables player data for all players in a tournament
   * 
   * How it works:
   * 1. Scans tournament data for cross-tables IDs (from player.etc.xtid fields)
   * 2. Checks which players we already have in our cross_tables_players table
   * 3. Only fetches missing players from cross-tables.com API (incremental sync)
   * 4. Stores fetched data in cross_tables_players table for future overlay use
   * 5. Optionally fetches detailed tournament history for enhanced overlays
   * 
   * This allows OBS overlays to join tournament players with rich cross-tables data
   * (ratings, rankings, stats, location, etc.) without hitting the API during broadcasts.
   * 
   * Called when:
   * - New tournament is created
   * - Tournament file is manually updated  
   * - Polling service detects tournament changes
   */
  async syncPlayersFromTournament(tournamentData: TournamentData, includeDetailedData: boolean = false): Promise<void> {
    console.log('Starting cross-tables player sync for tournament...');
    
    // Step 1: Extract all cross-tables IDs from tournament player data
    const crossTablesIds = this.extractCrossTablesIds(tournamentData);
    
    if (crossTablesIds.length === 0) {
      console.log('No cross-tables IDs found in tournament data');
      return;
    }

    console.log(`Found ${crossTablesIds.length} cross-tables IDs in tournament:`, crossTablesIds);
    
    // Step 2-4: Only fetch players we don't already have (incremental sync)
    await this.ensureGlobalPlayersExist(crossTablesIds);
    
    // Step 5: Optionally fetch detailed tournament history
    if (includeDetailedData) {
      console.log('Fetching detailed tournament history for enhanced overlays...');
      await this.syncDetailedPlayerData(crossTablesIds);
    }
    
    console.log('Cross-tables player sync completed');
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

  private extractCrossTablesIds(tournamentData: TournamentData): number[] {
    const ids = new Set<number>();
    
    for (const division of tournamentData.divisions) {
      for (const player of division.players) {
        if (player?.etc?.xtid) {
          ids.add(player.etc.xtid);
        }
      }
    }
    
    return Array.from(ids);
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
    
    // Build a map of seed -> xtid from tournament data
    const seedToXtidMap = new Map<number, number>();
    
    for (const division of tournamentData.divisions) {
      for (const player of division.players) {
        if (player?.etc?.xtid && player.id) {
          seedToXtidMap.set(player.id, player.etc.xtid);
        }
      }
    }
    
    if (seedToXtidMap.size === 0) {
      console.log('No players with xtids found in tournament data, skipping updates');
      return;
    }
    
    console.log(`🔗 CrossTablesSync: Found ${seedToXtidMap.size} players with xtids to update`);
    
    // Update the tournament player records with their xtids
    await this.tournamentRepo.updatePlayersWithXtids(tournamentId, seedToXtidMap);
    
    console.log(`✅ CrossTablesSync: Updated tournament ${tournamentId} player xtids`);
  }

  async syncSpecificPlayers(playerIds: number[]): Promise<void> {
    console.log(`Syncing specific players: ${playerIds.join(', ')}`);
    await this.fetchAndStorePlayerData(playerIds);
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