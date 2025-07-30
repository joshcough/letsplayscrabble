// import { Division, RawPlayer } from "@shared/types/tournament";
//
// /**
//  * Pure functional game comparison logic
//  * No side effects, no database calls, just data transformation
//  */
//
// export type GameKey = string;
// export type GameId = number;
//
// export interface GameData {
//   round_id: number;
//   player1_id: number;
//   player2_id: number;
//   player1_score: number;
//   player2_score: number;
//   is_bye: boolean;
//   pairing_id: number;
//   // Metadata for popups/notifications
//   player1_file_id?: number;
//   player2_file_id?: number;
//   player1_name?: string;
//   player2_name?: string;
// }
//
// export interface DatabaseGame {
//   round_number: number;
//   player1_score: number;
//   player2_score: number;
//   is_bye: boolean;
//   p1_file_id: number;
//   p2_file_id: number;
//   game_db_id: number;
// }
//
// export interface DatabaseDivision {
//   games: DatabaseGame[];
//   division_id: number;
//   roundIdMap: Map<number, number>; // round_number -> round_id
//   playerIdMap: Map<number, number>; // file_player_id -> db_player_id
// }
//
// export interface GameComparison {
//   toBeInserted: Array<[GameKey, GameData]>;
//   toBeUpdated: Array<[GameId, GameData]>;
//   unchanged: number;
// }
//
// /**
//  * Generate a consistent game key for comparison
//  * Uses same logic as existing code to avoid duplicates
//  */
// function createGameKey(roundNumber: number, player1FileId: number, player2FileId: number, isBye: boolean): GameKey {
//   if (isBye) {
//     return `${roundNumber}-${player1FileId}-bye`;
//   }
//   const minId = Math.min(player1FileId, player2FileId);
//   const maxId = Math.max(player1FileId, player2FileId);
//   return `${roundNumber}-${minId}-${maxId}`;
// }
//
// /**
//  * Convert file division player games to standardized game data
//  * Returns Map<GameKey, GameData> for easy comparison
//  */
// function extractGamesFromFileDivision(
//   division: Division,
//   roundIdMap: Map<number, number>,
//   playerIdMap: Map<number, number>
// ): Map<GameKey, GameData> {
//   const games = new Map<GameKey, GameData>();
//
//   // Process each player's games
//   for (const player of division.players) {
//     if (!player?.pairings || !player?.scores) continue;
//
//     const dbPlayerId = playerIdMap.get(player.id);
//     if (!dbPlayerId) continue;
//
//     for (let roundIndex = 0; roundIndex < player.pairings.length; roundIndex++) {
//       const roundNumber = roundIndex + 1;
//       const opponentId = player.pairings[roundIndex];
//       const playerScore = player.scores[roundIndex];
//       const roundId = roundIdMap.get(roundNumber);
//
//       if (!roundId) continue;
//
//       if (opponentId === 0) {
//         // Handle bye game
//         const gameKey = createGameKey(roundNumber, player.id, player.id, true);
//
//         if (!games.has(gameKey)) {
//           games.set(gameKey, {
//             round_id: roundId,
//             player1_id: dbPlayerId,
//             player2_id: dbPlayerId,
//             player1_score: playerScore,
//             player2_score: 0,
//             is_bye: true,
//             pairing_id: player.id,
//             player1_file_id: player.id,
//             player1_name: player.name
//           });
//         }
//       } else {
//         // Handle regular game
//         const opponent = division.players.find(p => p?.id === opponentId);
//         if (!opponent?.scores) continue;
//
//         const dbOpponentId = playerIdMap.get(opponentId);
//         if (!dbOpponentId) continue;
//
//         const gameKey = createGameKey(roundNumber, player.id, opponentId, false);
//
//         // Only process if we haven't seen this pairing yet
//         if (!games.has(gameKey)) {
//           const opponentScore = opponent.scores[roundIndex];
//           const isPlayer1First = player.etc?.p12?.[roundIndex] === 1;
//
//           // Determine player order based on p12 values
//           const [player1Id, player2Id, score1, score2, p1FileId, p2FileId, p1Name, p2Name] = isPlayer1First
//             ? [dbPlayerId, dbOpponentId, playerScore, opponentScore, player.id, opponentId, player.name, opponent.name]
//             : [dbOpponentId, dbPlayerId, opponentScore, playerScore, opponentId, player.id, opponent.name, player.name];
//
//           games.set(gameKey, {
//             round_id: roundId,
//             player1_id: player1Id,
//             player2_id: player2Id,
//             player1_score: score1,
//             player2_score: score2,
//             is_bye: false,
//             pairing_id: Math.min(player.id, opponentId),
//             player1_file_id: p1FileId,
//             player2_file_id: p2FileId,
//             player1_name: p1Name,
//             player2_name: p2Name
//           });
//         }
//       }
//     }
//   }
//
//   return games;
// }
//
// /**
//  * Convert database games to Map<GameKey, DatabaseGame> for comparison
//  */
// function extractGamesFromDatabase(dbDivision: DatabaseDivision): Map<GameKey, DatabaseGame> {
//   const games = new Map<GameKey, DatabaseGame>();
//
//   for (const game of dbDivision.games) {
//     const gameKey = createGameKey(
//       game.round_number,
//       game.p1_file_id,
//       game.p2_file_id,
//       game.is_bye
//     );
//     games.set(gameKey, game);
//   }
//
//   return games;
// }
//
// /**
//  * Check if two games have different scores
//  */
// function hasGameChanged(fileGame: GameData, dbGame: DatabaseGame): boolean {
//   if (fileGame.is_bye) {
//     return fileGame.player1_score !== dbGame.player1_score;
//   }
//   return fileGame.player1_score !== dbGame.player1_score ||
//          fileGame.player2_score !== dbGame.player2_score;
// }
//
// /**
//  * Pure function to compare games between file and database
//  * Returns what needs to be inserted, updated, or is unchanged
//  */
// export function compareGameDivisions(
//   divisionFromFile: Division,
//   divisionFromDb: DatabaseDivision
// ): GameComparison {
//   // Extract games from both sources
//   const fileGames = extractGamesFromFileDivision(
//     divisionFromFile,
//     divisionFromDb.roundIdMap,
//     divisionFromDb.playerIdMap
//   );
//   const dbGames = extractGamesFromDatabase(divisionFromDb);
//
//   const toBeInserted: Array<[GameKey, GameData]> = [];
//   const toBeUpdated: Array<[GameId, GameData]> = [];
//   let unchanged = 0;
//
//   // Compare file games against database games
//   for (const [gameKey, fileGame] of fileGames) {
//     const dbGame = dbGames.get(gameKey);
//
//     if (!dbGame) {
//       // New game - needs to be inserted
//       toBeInserted.push([gameKey, fileGame]);
//     } else if (hasGameChanged(fileGame, dbGame)) {
//       // Game exists but scores changed - needs to be updated
//       toBeUpdated.push([dbGame.game_db_id, fileGame]);
//     } else {
//       // Game unchanged
//       unchanged++;
//     }
//   }
//
//   return { toBeInserted, toBeUpdated, unchanged };
// }
//
// /**
//  * Helper function to aggregate results across multiple divisions
//  */
// export function aggregateGameComparisons(comparisons: GameComparison[]): GameComparison {
//   return comparisons.reduce(
//     (acc, curr) => ({
//       toBeInserted: [...acc.toBeInserted, ...curr.toBeInserted],
//       toBeUpdated: [...acc.toBeUpdated, ...curr.toBeUpdated],
//       unchanged: acc.unchanged + curr.unchanged
//     }),
//     { toBeInserted: [], toBeUpdated: [], unchanged: 0 }
//   );
// }
