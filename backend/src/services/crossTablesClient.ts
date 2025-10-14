import axios from 'axios';
import { CrossTablesPlayer, DetailedCrossTablesPlayer } from '@shared/types/domain';

export class CrossTablesClient {
  private static readonly BASE_URL = 'https://cross-tables.com/rest';

  static async getPlayer(playerid: number): Promise<CrossTablesPlayer | null> {
    try {
      const response = await axios.get<CrossTablesPlayer>(
        `${this.BASE_URL}/players.php?playerlist=${playerid}`
      );
      return Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error(`Failed to fetch player ${playerid} from cross-tables:`, error);
      return null;
    }
  }

  static async getDetailedPlayer(playerid: number): Promise<DetailedCrossTablesPlayer | null> {
    try {
      const response = await axios.get<{ player: any }>(
        `${this.BASE_URL}/player.php?player=${playerid}&results=1`
      );
      
      const playerData = response.data?.player;
      if (!playerData) return null;
      
      // Transform the API response to our domain format
      const detailedPlayer: DetailedCrossTablesPlayer = {
        playerid: parseInt(playerData.playerid),
        name: playerData.name,
        twlrating: playerData.twlrating ? parseInt(playerData.twlrating) : undefined,
        cswrating: playerData.cswrating ? parseInt(playerData.cswrating) : undefined,
        twlranking: playerData.twlranking ? parseInt(playerData.twlranking) : undefined,
        cswranking: playerData.cswranking ? parseInt(playerData.cswranking) : undefined,
        w: playerData.w ? parseInt(playerData.w) : undefined,
        l: playerData.l ? parseInt(playerData.l) : undefined,
        t: playerData.t ? parseInt(playerData.t) : undefined,
        b: playerData.b ? parseInt(playerData.b) : undefined,
        photourl: playerData.photourl,
        city: playerData.city,
        state: playerData.state,
        country: playerData.country,
        // Use the player-level average scores from the main player data
        averageScore: playerData.scoreavg ? parseInt(playerData.scoreavg) : undefined,
        opponentAverageScore: playerData.scoreoppavg ? parseInt(playerData.scoreoppavg) : undefined,
        results: playerData.results || []
      };
      
      return detailedPlayer;
    } catch (error) {
      console.error(`Failed to fetch detailed player ${playerid} from cross-tables:`, error);
      return null;
    }
  }

  static async getPlayers(playerids: number[]): Promise<CrossTablesPlayer[]> {
    try {
      const response = await axios.get<{ players: CrossTablesPlayer[] }>(
        `${this.BASE_URL}/players.php?playerlist=${playerids.join(',')}`
      );
      return response.data.players || [];
    } catch (error) {
      console.error('Failed to fetch players from cross-tables:', error);
      return [];
    }
  }

  static async searchPlayers(searchTerm: string): Promise<CrossTablesPlayer[]> {
    try {
      const response = await axios.get<{ players: CrossTablesPlayer[] }>(
        `${this.BASE_URL}/players.php?search=${encodeURIComponent(searchTerm)}`
      );
      return response.data.players || [];
    } catch (error) {
      console.error('Failed to search players from cross-tables:', error);
      return [];
    }
  }

  static async getAllPlayersIdsOnly(): Promise<{playerid: string, name: string}[]> {
    try {
      const response = await axios.get<{ players: {playerid: string, name: string}[] }>(
        `${this.BASE_URL}/players.php?idsonly=1`
      );
      return response.data.players || [];
    } catch (error) {
      console.error('Failed to fetch all players from cross-tables:', error);
      return [];
    }
  }
}