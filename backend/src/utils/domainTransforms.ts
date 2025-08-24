// backend/src/utils/domainTransforms.ts
// Transform database rows into proper domain model types
import * as Domain from "@shared/types/domain";

import * as DBCurrentMatch from "../types/currentMatch";
import * as DB from "../types/database";

/**
 * Transform tournament row to domain summary (metadata only)
 */
export function transformTournamentRowToSummary(
  tournamentRow: DB.TournamentRow,
): Domain.TournamentSummary {
  return {
    id: tournamentRow.id,
    name: tournamentRow.name,
    city: tournamentRow.city,
    year: tournamentRow.year,
    lexicon: tournamentRow.lexicon,
    longFormName: tournamentRow.long_form_name,
    dataUrl: tournamentRow.data_url,
    pollUntil: tournamentRow.poll_until
      ? new Date(tournamentRow.poll_until)
      : null,
  };
}

/**
 * Transform flat database response into proper domain tree structure
 */
export function transformToDomainTournament(
  flatTournament: DB.Tournament,
): Domain.Tournament {
  const divisions = flatTournament.divisions.map((divisionData) => {
    // Transform players and extract ratings from etc_data
    const players = divisionData.players.map(
      (playerRow): Domain.Player => {
        // Build xtData from joined cross-tables data if available
        const xtData: Domain.CrossTablesPlayer | null = playerRow.xt_cross_tables_id && playerRow.xt_name ? {
          playerid: playerRow.xt_cross_tables_id,
          name: playerRow.xt_name,
          twlrating: playerRow.twl_rating || undefined,
          cswrating: playerRow.csw_rating || undefined,
          twlranking: playerRow.twl_ranking || undefined,
          cswranking: playerRow.csw_ranking || undefined,
          w: playerRow.wins || undefined,
          l: playerRow.losses || undefined,
          t: playerRow.ties || undefined,
          b: playerRow.byes || undefined,
          photourl: playerRow.photo_url || undefined,
          city: playerRow.xt_city || undefined,
          state: playerRow.xt_state || undefined,
          country: playerRow.xt_country || undefined,
          // Enhanced tournament data
          tournamentCount: playerRow.tournament_count || undefined,
          averageScore: playerRow.average_score || undefined,
          results: playerRow.tournament_results ? 
            (typeof playerRow.tournament_results === 'string' ? 
              JSON.parse(playerRow.tournament_results) : 
              playerRow.tournament_results) : undefined,
        } : null;
        
        return {
          id: playerRow.id,
          seed: playerRow.seed,
          name: playerRow.name,
          initialRating: playerRow.initial_rating,
          photo: playerRow.photo,
          ratingsHistory: playerRow.etc_data?.newr || [playerRow.initial_rating], // Extract from etc_data
          xtData, // Full cross-tables data
        };
      },
    );

    // Create player lookup for games
    const playersById = new Map(players.map((p) => [p.id, p]));

    // Transform games to use player IDs instead of embedding full objects
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
  dbChanges: DB.GameChanges,
): Domain.GameChanges {
  const addedGames = dbChanges.added.map(
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

  const updatedGames = dbChanges.updated.map(
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
    added: addedGames,
    updated: updatedGames,
  };
}

/**
 * Transform database current match to domain current match
 */
export function transformCurrentMatchToDomain(
  dbCurrentMatch: DBCurrentMatch.CurrentMatch,
): Domain.CurrentMatch {
  return {
    tournamentId: dbCurrentMatch.tournament_id,
    divisionId: dbCurrentMatch.division_id,
    divisionName: dbCurrentMatch.division_name,
    round: dbCurrentMatch.round,
    pairingId: dbCurrentMatch.pairing_id,
    updatedAt: dbCurrentMatch.updated_at,
  };
}

/**
 * Transform domain create current match to database format
 */
export function transformCreateCurrentMatchToDatabase(
  domainCreateMatch: Domain.CreateCurrentMatch,
): DBCurrentMatch.CreateCurrentMatch {
  return {
    tournament_id: domainCreateMatch.tournamentId,
    division_id: domainCreateMatch.divisionId,
    round: domainCreateMatch.round,
    pairing_id: domainCreateMatch.pairingId,
  };
}
