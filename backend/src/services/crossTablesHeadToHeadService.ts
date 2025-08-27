import * as Domain from "@shared/types/domain";
import { CrossTablesHeadToHeadRepository } from "../repositories/crossTablesHeadToHeadRepository";

export class CrossTablesHeadToHeadService {
  constructor(
    private readonly repository: CrossTablesHeadToHeadRepository,
  ) {}

  /**
   * Fetch and store head-to-head data for all players in a division
   * Currently makes multiple API calls - will be replaced with bulk endpoint later
   */
  async syncHeadToHeadDataForPlayers(playerIds: number[]): Promise<void> {
    if (playerIds.length === 0) {
      console.log("⚠️ No player IDs provided for head-to-head sync");
      return;
    }

    console.log(`🔄 Syncing head-to-head data for ${playerIds.length} players: ${playerIds.join(', ')}`);

    try {
      const response = await this.fetchBulkHeadToHeadData(playerIds);
      await this.repository.storeHeadToHeadGames(response.games);
      
      console.log(`🎯 Head-to-head sync completed: ${response.games.length} games stored`);
    } catch (error) {
      console.error("❌ Error syncing head-to-head data:", error);
      throw error;
    }
  }

  /**
   * Get head-to-head record between two specific players
   * Uses cached database data, no API call needed
   */
  async getHeadToHeadRecord(player1Id: number, player2Id: number): Promise<Domain.HeadToHeadRecord> {
    return this.repository.getHeadToHeadRecord(player1Id, player2Id);
  }

  /**
   * Get all head-to-head games for players in a division
   * Returns games between any combination of the provided players
   */
  async getHeadToHeadGamesForDivision(playerIds: number[]): Promise<Domain.HeadToHeadGame[]> {
    const rows = await this.repository.getHeadToHeadGamesForPlayers(playerIds);
    
    // Convert database rows to domain objects
    return rows.map(row => ({
      gameid: row.game_id,
      date: row.date || "",
      player1: {
        playerid: row.player1_id,
        name: row.player1_name || "",
        score: row.player1_score || 0,
        oldrating: row.player1_old_rating || 0,
        newrating: row.player1_new_rating || 0,
        position: row.player1_position || undefined,
      },
      player2: {
        playerid: row.player2_id,
        name: row.player2_name || "",
        score: row.player2_score || 0,
        oldrating: row.player2_old_rating || 0,
        newrating: row.player2_new_rating || 0,
        position: row.player2_position || undefined,
      },
      annotated: row.annotated || undefined,
    }));
  }

  /**
   * Fetch head-to-head data for all combinations of players
   * Currently makes multiple API calls - will be replaced with bulk endpoint later
   */
  private async fetchBulkHeadToHeadData(playerIds: number[]): Promise<{ games: Domain.HeadToHeadGame[] }> {
    const allGames: Domain.HeadToHeadGame[] = [];
    const gameIds = new Set<number>(); // Track game IDs to avoid duplicates
    
    // Generate all unique pairs of players
    const pairs: [number, number][] = [];
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        pairs.push([playerIds[i], playerIds[j]]);
      }
    }
    
    console.log(`🔄 Fetching head-to-head data for ${pairs.length} player pairs`);
    console.log(`👥 Player pairs to check:`, pairs.map(([p1, p2]) => `${p1}+${p2}`).join(', '));
    
    // Rate limiting: process pairs in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pairs.length/batchSize)}: ${batch.map(([p1, p2]) => `${p1}+${p2}`).join(', ')}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(([player1Id, player2Id]) => 
        this.fetchHeadToHeadForPair(player1Id, player2Id)
      );
      
      const batchResults = await Promise.all(batchPromises);
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} completed`);
      
      
      // Combine results and deduplicate
      for (const games of batchResults) {
        for (const game of games) {
          if (!gameIds.has(game.gameid)) {
            gameIds.add(game.gameid);
            allGames.push(game);
          }
        }
      }
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < pairs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Fetched ${allGames.length} unique head-to-head games from ${pairs.length} API calls`);
    return { games: allGames };
  }

  /**
   * Fetch head-to-head data for a single pair of players using existing endpoint
   */
  private async fetchHeadToHeadForPair(player1Id: number, player2Id: number): Promise<Domain.HeadToHeadGame[]> {
    const url = `https://cross-tables.com/rest/headtohead.php?players=${player1Id}+${player2Id}`;
    
    console.log(`🌐 Fetching H2H data: ${url}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ HTTP ${response.status} for players ${player1Id}+${player2Id}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 API Response for ${player1Id}+${player2Id}:`, JSON.stringify(data, null, 2));
      
      // Handle both formats: direct array or wrapped in { games: [...] }
      let games: any[];
      if (Array.isArray(data)) {
        games = data;
      } else if (data && Array.isArray(data.games)) {
        games = data.games;
      } else {
        console.warn(`⚠️ Unexpected response format for players ${player1Id}+${player2Id}:`, data);
        return [];
      }
      
      console.log(`🎮 Found ${games.length} historical games between players ${player1Id} and ${player2Id}`);
      
      // Convert API response to our domain format
      // API returns flat winner/loser fields, but we store as player1/player2 to handle ties
      return games.map((apiGame: any): Domain.HeadToHeadGame => ({
        gameid: parseInt(apiGame.gameid),
        date: apiGame.date,
        player1: {
          playerid: parseInt(apiGame.winnerid),
          name: apiGame.winnername,
          score: parseInt(apiGame.winnerscore),
          oldrating: parseInt(apiGame.winneroldrating),
          newrating: parseInt(apiGame.winnernewrating),
          position: apiGame.winnerpos ? parseInt(apiGame.winnerpos) : undefined,
        },
        player2: {
          playerid: parseInt(apiGame.loserid),
          name: apiGame.losername,
          score: parseInt(apiGame.loserscore),
          oldrating: parseInt(apiGame.loseroldrating),
          newrating: parseInt(apiGame.losernewrating),
          position: apiGame.loserpos ? parseInt(apiGame.loserpos) : undefined,
        },
        annotated: apiGame.annotatedurl || undefined,
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching H2H data for players ${player1Id}+${player2Id}:`, error);
      console.error(`🔗 Failed URL: ${url}`);
      return []; // Return empty array on error, don't fail entire batch
    }
  }

  /**
   * Utility to extract player IDs from a division for head-to-head sync
   */
  extractPlayerIdsFromDivision(division: Domain.Division): number[] {
    return division.players
      .filter(player => player.xtid !== null) // Only players with cross-tables IDs
      .map(player => player.xtid as number);
  }

  /**
   * Utility to extract player IDs from a file format division for head-to-head sync
   */
  extractPlayerIdsFromFileDivision(division: { players: Array<{ etc: { xtid: number | null } } | null> }): number[] {
    return division.players
      .filter(player => player && player.etc.xtid !== null) // Only non-null players with cross-tables IDs
      .map(player => player!.etc.xtid as number);
  }
}