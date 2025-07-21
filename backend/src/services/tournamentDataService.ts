// backend/src/services/tournamentDataService.ts
import { Knex } from "knex";
import { TournamentData, Division, RawPlayer } from "@shared/types/tournament";

export class TournamentDataService {
  constructor(private readonly knex: Knex) {}

  async storeTournamentData(tournamentId: number, data: TournamentData): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // Clear existing data for this tournament
      await this.clearTournamentData(trx, tournamentId);

      // Insert divisions and their data
      for (let divisionIndex = 0; divisionIndex < data.divisions.length; divisionIndex++) {
        const division = data.divisions[divisionIndex];
        await this.insertDivisionData(trx, tournamentId, division, divisionIndex);
      }
    });
  }

  private async clearTournamentData(trx: Knex.Transaction, tournamentId: number): Promise<void> {
    // Delete in reverse order due to foreign key constraints
    await trx('games')
      .whereIn('round_id',
        trx('rounds')
          .select('id')
          .whereIn('division_id',
            trx('divisions').select('id').where('tournament_id', tournamentId)
          )
      )
      .del();

    await trx('rounds')
      .whereIn('division_id',
        trx('divisions').select('id').where('tournament_id', tournamentId)
      )
      .del();

    await trx('tournament_players').where('tournament_id', tournamentId).del();
    await trx('divisions').where('tournament_id', tournamentId).del();
  }

  private async insertDivisionData(
    trx: Knex.Transaction,
    tournamentId: number,
    division: Division,
    position: number
  ): Promise<void> {
    // Insert division
    const [divisionRecord] = await trx('divisions')
      .insert({
        tournament_id: tournamentId,
        name: division.name,
        position: position
      })
      .returning('id');

    const divisionId = divisionRecord.id;

    // Insert players
    const playerIdMap = new Map<number, number>(); // file player ID -> db player ID

    for (const player of division.players) {
      if (!player) continue;

      const [playerRecord] = await trx('tournament_players')
        .insert({
          tournament_id: tournamentId,
          division_id: divisionId,
          player_id: player.id,
          name: player.name,
          initial_rating: player.rating,
          photo: player.photo,
          etc_data: JSON.stringify(player.etc)
        })
        .returning('id');

      playerIdMap.set(player.id, playerRecord.id);
    }

    // Insert rounds and games
    await this.insertRoundsAndGames(trx, divisionId, division, playerIdMap);
  }

  private async insertRoundsAndGames(
    trx: Knex.Transaction,
    divisionId: number,
    division: Division,
    playerIdMap: Map<number, number>
  ): Promise<void> {
    // Determine the number of rounds from player data
    const maxRounds = Math.max(...division.players
      .filter(p => p !== null)
      .map(p => p!.pairings.length));

    // Create rounds first
    const roundInserts = [];
    for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
      roundInserts.push({
        division_id: divisionId,
        round_number: roundNum
      });
    }

    const roundRecords = await trx('rounds').insert(roundInserts).returning(['id', 'round_number']);
    const roundIdMap = new Map<number, number>();
    roundRecords.forEach(round => {
      roundIdMap.set(round.round_number, round.id);
    });

    // Track processed pairings to avoid duplicates
    const processedPairings = new Set<string>();
    const gameInserts = [];

    // Collect all games first
    for (const player of division.players) {
      if (!player) continue;

      const dbPlayerId = playerIdMap.get(player.id);
      if (!dbPlayerId) continue;

      for (let roundIndex = 0; roundIndex < player.pairings.length; roundIndex++) {
        const roundNum = roundIndex + 1;
        const opponentId = player.pairings[roundIndex];
        const playerScore = player.scores[roundIndex];

        const roundId = roundIdMap.get(roundNum);
        if (!roundId) continue;

        // Handle bye
        if (opponentId === 0) {
          const pairingKey = `${roundNum}-${player.id}-bye`;
          if (!processedPairings.has(pairingKey)) {
            gameInserts.push({
              round_id: roundId,
              player1_id: dbPlayerId,
              player2_id: dbPlayerId,
              player1_score: playerScore,
              player2_score: 0,
              is_bye: true,
              pairing_id: player.id
            });
            processedPairings.add(pairingKey);
          }
          continue;
        }

        // Regular game - avoid duplicate insertion
        const opponent = division.players.find(p => p?.id === opponentId);
        if (!opponent) continue;

        const dbOpponentId = playerIdMap.get(opponentId);
        if (!dbOpponentId) continue;

        // Create a consistent pairing key (smaller ID first)
        const pairingKey = `${roundNum}-${Math.min(player.id, opponentId)}-${Math.max(player.id, opponentId)}`;

        if (!processedPairings.has(pairingKey)) {
          const opponentScore = opponent.scores[roundIndex];

          // Determine player order based on p12 values
          const isPlayer1First = player.etc.p12[roundIndex] === 1;

          const [player1Id, player2Id, score1, score2] = isPlayer1First
            ? [dbPlayerId, dbOpponentId, playerScore, opponentScore]
            : [dbOpponentId, dbPlayerId, opponentScore, playerScore];

          gameInserts.push({
            round_id: roundId,
            player1_id: player1Id,
            player2_id: player2Id,
            player1_score: score1,
            player2_score: score2,
            is_bye: false,
            pairing_id: Math.min(player.id, opponentId)
          });

          processedPairings.add(pairingKey);
        }
      }
    }

    // Bulk insert all games
    if (gameInserts.length > 0) {
      await trx('games').insert(gameInserts);
    }
  }

  // Method to update existing tournament data (for incremental updates)
  async updateTournamentData(tournamentId: number, newData: TournamentData): Promise<void> {
    // For now, we'll do a full replace since incremental updates are complex
    // In the future, you could implement smart diffing here
    await this.storeTournamentData(tournamentId, newData);
  }
}