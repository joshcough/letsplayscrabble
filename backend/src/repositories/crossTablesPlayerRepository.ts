import { Knex } from 'knex';
import { knexDb } from '../config/database';
import { CrossTablesPlayer, DetailedCrossTablesPlayer, TournamentResult } from '@shared/types/domain';

export interface CrossTablesPlayerRecord {
  cross_tables_id: number;
  name: string;
  twl_rating?: number;
  csw_rating?: number;
  twl_ranking?: number;
  csw_ranking?: number;
  wins?: number;
  losses?: number;
  ties?: number;
  byes?: number;
  photo_url?: string;
  city?: string;
  state?: string;
  country?: string;
  tournament_results?: TournamentResult[]; // JSON field
  tournament_count?: number; // Cached count
  average_score?: number; // Cached average
  opponent_average_score?: number; // Cached opponent average
  created_at: Date;
  updated_at: Date;
}

export class CrossTablesPlayerRepository {
  private tableName = 'cross_tables_players';

  constructor() {}

  async upsertDetailedPlayer(playerData: DetailedCrossTablesPlayer): Promise<void> {
    const tournamentCount = playerData.results?.length || null;
    const averageScore = playerData.averageScore || null;
    const opponentAverageScore = playerData.opponentAverageScore || null;
      
    // Only update the detailed fields, don't touch basic player info that might be null in detailed response
    const detailedFields = {
      tournament_results: playerData.results ? JSON.stringify(playerData.results) : null,
      tournament_count: tournamentCount,
      average_score: averageScore,
      opponent_average_score: opponentAverageScore,
      updated_at: new Date(),
    };

    try {
      const updated = await knexDb(this.tableName)
        .where('cross_tables_id', playerData.playerid)
        .update(detailedFields);
        
      if (updated === 0) {
        console.warn(`No existing player found with ID ${playerData.playerid} to update detailed data`);
      } else {
        console.log(`Successfully updated detailed data for player ID ${playerData.playerid} (${tournamentCount} tournaments)`);
      }
    } catch (error) {
      console.error(`ERROR updating detailed player ${playerData.playerid}:`, error);
      throw error;
    }
  }

  async upsertPlayer(playerData: CrossTablesPlayer): Promise<void> {
    const record = {
      cross_tables_id: playerData.playerid,
      name: playerData.name,
      twl_rating: playerData.twlrating,
      csw_rating: playerData.cswrating,
      twl_ranking: playerData.twlranking,
      csw_ranking: playerData.cswranking,
      wins: playerData.w,
      losses: playerData.l,
      ties: playerData.t,
      byes: playerData.b,
      photo_url: playerData.photourl,
      city: playerData.city,
      state: playerData.state,
      country: playerData.country,
      updated_at: new Date(),
    };

    try {
      await knexDb(this.tableName)
        .insert(record)
        .onConflict('cross_tables_id')
        .merge(record);
      console.log(`Successfully upserted player ${playerData.name} (ID: ${playerData.playerid})`);
    } catch (error) {
      console.error(`ERROR upserting player ${playerData.playerid}:`, error);
      throw error;
    }
  }

  async upsertPlayers(playersData: CrossTablesPlayer[]): Promise<void> {
    if (playersData.length === 0) return;

    const records = playersData.map(player => ({
      cross_tables_id: player.playerid,
      name: player.name,
      twl_rating: player.twlrating,
      csw_rating: player.cswrating,
      twl_ranking: player.twlranking,
      csw_ranking: player.cswranking,
      wins: player.w,
      losses: player.l,
      ties: player.t,
      byes: player.b,
      photo_url: player.photourl,
      city: player.city,
      state: player.state,
      country: player.country,
      updated_at: new Date(),
    }));

    await knexDb.transaction(async (trx: Knex.Transaction) => {
      for (const record of records) {
        await trx(this.tableName)
          .insert(record)
          .onConflict('cross_tables_id')
          .merge(record);
      }
    });
  }

  async getPlayer(playerId: number): Promise<CrossTablesPlayerRecord | null> {
    const result = await knexDb(this.tableName)
      .where('cross_tables_id', playerId)
      .first();
    return result || null;
  }

  async getPlayers(playerIds: number[]): Promise<CrossTablesPlayerRecord[]> {
    try {
      const result = await knexDb(this.tableName)
        .whereIn('cross_tables_id', playerIds);
      console.log(`Retrieved ${result.length} players from database`);
      return result;
    } catch (error) {
      console.error(`ERROR getting players from database:`, error);
      throw error;
    }
  }

  async getAllPlayers(): Promise<CrossTablesPlayerRecord[]> {
    return await knexDb(this.tableName);
  }
}