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
      const response = await axios.get<DetailedCrossTablesPlayer>(
        `${this.BASE_URL}/player.php?player=${playerid}&results=1`
      );
      return response.data;
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
}