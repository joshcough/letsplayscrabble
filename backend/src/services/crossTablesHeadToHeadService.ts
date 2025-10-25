import * as Domain from "@shared/types/domain";
import { CrossTablesHeadToHeadRepository } from "../repositories/crossTablesHeadToHeadRepository";
import { extractXtidFromEtc } from "../utils/xtidHelpers";

// Cross-tables API response format for head-to-head games
interface CrossTablesApiGame {
  gameid: string;
  date: string;
  tourneyname?: string;
  winnerid: string;
  winnername: string;
  winnerscore: string;
  winneroldrating: string;
  winnernewrating: string;
  winnerposition?: string;
  winnerpos?: string; // Alternative field name
  loserid: string;
  losername: string;
  loserscore: string;
  loseroldrating: string;
  losernewrating: string;
  loserposition?: string;
  loserpos?: string; // Alternative field name
  annotated?: string;
  annotatedurl?: string; // Alternative field name
}

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
      tourneyname: row.tourney_name || undefined,
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
   * Uses the new bulk endpoint that accepts multiple players
   */
  private async fetchBulkHeadToHeadData(playerIds: number[]): Promise<{ games: Domain.HeadToHeadGame[] }> {
    // Use the new endpoint that accepts multiple players
    const url = `https://cross-tables.com/rest/headtohead.php?players=${playerIds.join('+')}`;
    
    console.log(`🔄 Fetching head-to-head data for ${playerIds.length} players with single API call`);
    console.log(`🌐 Fetching H2H data: ${url}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ HTTP ${response.status} for players ${playerIds.join('+')}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle both formats: direct array or wrapped in { games: [...] }
      let games: CrossTablesApiGame[];
      if (Array.isArray(data)) {
        games = data as CrossTablesApiGame[];
      } else if (data && Array.isArray((data as { games: unknown }).games)) {
        games = (data as { games: CrossTablesApiGame[] }).games;
      } else {
        console.warn(`⚠️ Unexpected response format for players ${playerIds.join('+')}:`, data);
        return { games: [] };
      }

      console.log(`📊 API Response: Found ${games.length} games for players ${playerIds.join(', ')}`);

      // Convert API response to our domain format
      // API returns flat winner/loser fields, but we store as player1/player2 to handle ties
      const allGames: Domain.HeadToHeadGame[] = games.map((apiGame: CrossTablesApiGame): Domain.HeadToHeadGame => ({
        gameid: parseInt(apiGame.gameid),
        date: apiGame.date,
        tourneyname: apiGame.tourneyname || undefined,
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
      
      console.log(`✅ Fetched ${allGames.length} unique head-to-head games with single API call`);
      return { games: allGames };
      
    } catch (error) {
      console.error(`❌ Error fetching H2H data for players ${playerIds.join('+')}:`, error);
      console.error(`🔗 Failed URL: ${url}`);
      throw error; // Re-throw error since this is our only API call now
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
  extractPlayerIdsFromFileDivision(division: { players: Array<{ etc: { xtid?: number | number[] | null | undefined } } | null> }): number[] {
    const ids: number[] = [];

    for (const player of division.players) {
      if (player?.etc?.xtid) {
        const xtid = extractXtidFromEtc(player.etc.xtid);
        if (xtid !== null) {
          ids.push(xtid);
        }
      }
    }

    return ids;
  }
}