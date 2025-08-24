import axios from 'axios';
import { CrossTablesPlayer } from '@shared/types/domain';

export class CrossTablesClient {
  private static readonly BASE_URL = 'https://cross-tables.com/rest';

  static async getPlayer(playerid: number): Promise<CrossTablesPlayer | null> {
    try {
      const response = await axios.get<CrossTablesPlayer>(
        `${this.BASE_URL}/player.php?player=${playerid}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch player ${playerid} from cross-tables:`, error);
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