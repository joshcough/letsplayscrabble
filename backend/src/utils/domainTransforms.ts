// backend/src/utils/domainTransforms.ts
// Transform database rows into proper domain model types

import * as Domain from "@shared/types/domain";
import * as DB from "../types/database";

/**
 * Transform flat database response into proper domain tree structure
 */
export function transformToDomainTournament(
  flatTournament: DB.Tournament
): Domain.Tournament {
  const divisions = flatTournament.divisions.map((divisionData) => {
    // Transform players and extract ratings from etc_data
    const players = divisionData.players.map((playerRow): Domain.Player => ({
      id: playerRow.id,
      seed: playerRow.seed,
      name: playerRow.name,
      initialRating: playerRow.initial_rating,
      photo: playerRow.photo,
      ratingsHistory: playerRow.etc_data?.newr || [playerRow.initial_rating], // Extract from etc_data
    }));

    // Create player lookup for games
    const playersById = new Map(players.map(p => [p.id, p]));

    // Transform games to use player IDs instead of embedding full objects
    const games = divisionData.games.map((gameRow): Domain.Game => ({
      id: gameRow.id,
      roundNumber: gameRow.round_number,
      player1Id: gameRow.player1_id,
      player2Id: gameRow.player2_id,
      player1Score: gameRow.player1_score,
      player2Score: gameRow.player2_score,
      isBye: gameRow.is_bye,
      pairingId: gameRow.pairing_id,
    }));

    return {
      id: divisionData.division.id,
      name: divisionData.division.name,
      players,
      games,
    };
  });

  return {
    id: flatTournament.tournament.id,
    name: flatTournament.tournament.name,
    city: flatTournament.tournament.city,
    year: flatTournament.tournament.year,
    lexicon: flatTournament.tournament.lexicon,
    longFormName: flatTournament.tournament.long_form_name,
    dataUrl: flatTournament.tournament.data_url,
    divisions,
  };
}

/**
 * Convert database game changes to domain game changes
 * ZZZ this looks sus
 */
export function transformGameChangesToDomain(
  dbChanges: DB.GameChanges
): Domain.GameChanges {
  const addedGames = dbChanges.added.map((gameRow): Domain.Game => ({
    id: gameRow.id,
    roundNumber: gameRow.round_number,
    player1Id: gameRow.player1_id,
    player2Id: gameRow.player2_id,
    player1Score: gameRow.player1_score,
    player2Score: gameRow.player2_score,
    isBye: gameRow.is_bye,
    pairingId: gameRow.pairing_id,
  }));

  const updatedGames = dbChanges.updated.map((gameRow): Domain.Game => ({
    id: gameRow.id,
    roundNumber: gameRow.round_number,
    player1Id: gameRow.player1_id,
    player2Id: gameRow.player2_id,
    player1Score: gameRow.player1_score,
    player2Score: gameRow.player2_score,
    isBye: gameRow.is_bye,
    pairingId: gameRow.pairing_id,
  }));

  return {
    added: addedGames,
    updated: updatedGames,
  };
}

