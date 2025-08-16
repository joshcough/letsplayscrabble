// frontend/src/utils/domainTransforms.ts
// Transform API responses into clean domain model types
import * as DB from "@shared/types/database";
import * as Domain from "@shared/types/domain";

/**
 * Transform the old flat Tournament API response to clean domain model
 */
export function transformToDomainTournament(
  apiResponse: DB.Tournament,
): Domain.Tournament {
  const divisions = apiResponse.divisions.map((divisionData) => {
    // Transform players with ratings history extracted from etc_data
    const players = divisionData.players.map(
      (playerRow): Domain.Player => ({
        id: playerRow.id,
        seed: playerRow.seed,
        name: playerRow.name,
        initialRating: playerRow.initial_rating,
        photo: playerRow.photo,
        ratingsHistory: playerRow.etc_data?.newr || [playerRow.initial_rating],
      }),
    );

    // Transform games to use player IDs instead of embedding objects
    const games = divisionData.games.map(
      (gameRow): Domain.Game => ({
        id: gameRow.id,
        roundNumber: gameRow.round_number,
        player1Id: gameRow.player1_id,
        player2Id: gameRow.player2_id,
        player1Score: gameRow.player1_score,
        player2Score: gameRow.player2_score,
        isBye: gameRow.is_bye,
        pairingId: gameRow.pairing_id,
      }),
    );

    return {
      id: divisionData.division.id,
      name: divisionData.division.name,
      position: divisionData.division.position,
      players,
      games,
    };
  });

  return {
    id: apiResponse.tournament.id,
    name: apiResponse.tournament.name,
    city: apiResponse.tournament.city,
    year: apiResponse.tournament.year,
    lexicon: apiResponse.tournament.lexicon,
    longFormName: apiResponse.tournament.long_form_name,
    divisions,
  };
}

/**
 * Helper to find a player by ID in a domain tournament
 */
export function findPlayerInTournament(
  tournament: Domain.Tournament,
  playerId: number,
): Domain.Player | null {
  for (const division of tournament.divisions) {
    const player = division.players.find((p) => p.id === playerId);
    if (player) return player;
  }
  return null;
}

/**
 * Helper to find games for a player in a tournament
 */
export function getGamesForPlayer(
  tournament: Domain.Tournament,
  playerId: number,
): Array<{ game: Domain.Game; division: Domain.Division }> {
  const results: Array<{ game: Domain.Game; division: Domain.Division }> = [];

  for (const division of tournament.divisions) {
    const playerGames = division.games.filter(
      (g) => g.player1Id === playerId || g.player2Id === playerId,
    );

    for (const game of playerGames) {
      results.push({ game, division });
    }
  }

  return results;
}

/**
 * Helper to get games for a specific round in a division
 */
export function getGamesForRound(
  division: Domain.Division,
  roundNumber: number,
): Domain.Game[] {
  return division.games.filter((g) => g.roundNumber === roundNumber);
}
