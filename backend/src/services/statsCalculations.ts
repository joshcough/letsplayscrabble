// // backend/src/services/statsCalculations
import { PlayerRow, GameRow, GameWithPlayers } from "@shared/types/database";
// import { DivisionStats, PlayerDisplayData, PlayerStats } from "@shared/types/stats";
//
// // interface DatabasePlayer {
// //   id: number;
// //   player_id: number;
// //   name: string;
// //   initial_rating: number;
// //   photo: string;
// //   etc_data: any;
// // }
// //
// // interface DatabaseGame {
// //   round_number: number;
// //   player1_id: number;
// //   player2_id: number;
// //   player1_score: number | null;
// //   player2_score: number | null;
// //   is_bye: boolean;
// //   opponent_name: string;
// //   opponent_etc: any;
// // }
// //
// // interface GameForStats {
// //   player1_score: number;
// //   player2_score: number;
// //   player1_file_id: number;
// //   player2_file_id: number;
// //   player1_etc: any;
// //   round_number: number;
// // }
//
// /**
//  * Pure utility functions for calculating tournament statistics
//  */
//
// export function getOrdinal(n: number): string {
//   try {
//     const lastDigit = n % 10;
//     const lastTwoDigits = n % 100;
//
//     if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
//       return n + "th";
//     }
//
//     switch (lastDigit) {
//       case 1:
//         return n + "st";
//       case 2:
//         return n + "nd";
//       case 3:
//         return n + "rd";
//       default:
//         return n + "th";
//     }
//   } catch (error) {
//     console.error("Error in getOrdinal:", error);
//     return n + "th";
//   }
// }
//
// export function formatName(name: string | undefined): string {
//   try {
//     if (!name) {
//       console.log("Name is null or empty");
//       return "Unknown Player";
//     }
//
//     if (!name.includes(",")) {
//       return name;
//     }
//
//     const [last, first] = name.split(", ");
//     if (!first || !last) {
//       console.log("Invalid name format after split:", { last, first });
//       return name;
//     }
//
//     return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
//   } catch (error) {
//     console.error("Error formatting name:", name, error);
//     return "Unknown Player";
//   }
// }
//
// // export function calculateAllRanks(players: PlayerStats[]): PlayerStats[] {
// //   // First calculate win/loss/spread ranks
// //   const playersByWins = [...players].sort((a, b) => {
// //     if (a.wins !== b.wins) return b.wins - a.wins;
// //     if (a.losses !== b.losses) return a.losses - b.losses;
// //     return b.spread - a.spread;
// //   });
// //
// //   // Calculate average score ranks (higher is better)
// //   const playersByAvgScore = [...players].sort((a, b) => {
// //     return b.averageScore - a.averageScore;
// //   });
// //
// //   // Calculate opponent score ranks (lower is better)
// //   const playersByOpponentScore = [...players].sort((a, b) => {
// //     return (
// //       parseFloat(a.averageOpponentScore) - parseFloat(b.averageOpponentScore)
// //     );
// //   });
// //
// //   // Create maps for all rankings
// //   const rankMap = new Map<number, number>();
// //   const avgScoreRankMap = new Map<number, number>();
// //   const avgOpponentScoreRankMap = new Map<number, number>();
// //
// //   playersByWins.forEach((player, index) => {
// //     rankMap.set(player.id, index + 1);
// //   });
// //
// //   playersByAvgScore.forEach((player, index) => {
// //     avgScoreRankMap.set(player.id, index + 1);
// //   });
// //
// //   playersByOpponentScore.forEach((player, index) => {
// //     avgOpponentScoreRankMap.set(player.id, index + 1);
// //   });
// //
// //   // Apply all rankings to players
// //   return players.map((player) => {
// //     const averageScoreRank = avgScoreRankMap.get(player.id) ?? 0;
// //     const averageOpponentScoreRank =
// //       avgOpponentScoreRankMap.get(player.id) ?? 0;
// //     const rank = rankMap.get(player.id) ?? 0;
// //
// //     return {
// //       ...player,
// //       rank,
// //       rankOrdinal: getOrdinal(rank),
// //       averageScoreRank,
// //       averageScoreRankOrdinal: getOrdinal(averageScoreRank),
// //       averageOpponentScoreRank,
// //       averageOpponentScoreRankOrdinal: getOrdinal(averageOpponentScoreRank),
// //     };
// //   });
// // }
//
// export function calculatePlayerStatsFromGames(player: DatabasePlayer, games: DatabaseGame[]): PlayerStats {
//   let totalSpread = 0;
//   let totalScore = 0;
//   let totalOpponentScore = 0;
//   let highScore = 0;
//   let wins = 0;
//   let losses = 0;
//   let ties = 0;
//   let gamesPlayed = 0;
//
//   for (const game of games) {
//     if (game.is_bye) {
//       // Handle bye
//       const byeScore = game.player1_score; // Already flipped for player perspective
//       if (byeScore !== null) {
//         totalSpread += byeScore;
//         if (byeScore > 0) wins += 1;
//         else losses += 1;
//       }
//     } else {
//       // Regular game - already from player's perspective
//       const playerScore = game.player1_score;
//       const opponentScore = game.player2_score;
//
//       if (playerScore !== null && opponentScore !== null) {
//         const spread = playerScore - opponentScore;
//         totalSpread += spread;
//
//         if (playerScore > opponentScore) wins += 1;
//         else if (playerScore < opponentScore) losses += 1;
//         else ties += 1;
//
//         totalScore += playerScore;
//         totalOpponentScore += opponentScore;
//         highScore = Math.max(highScore, playerScore);
//         gamesPlayed += 1;
//       }
//     }
//   }
//
//   const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;
//   const averageOpponentScore = gamesPlayed > 0 ? (totalOpponentScore / gamesPlayed).toFixed(1) : "0";
//
//   // Calculate current rating and rating diff from etc_data
//   let currentRating = 0;
//   let ratingDiff = 0;
//   const etcData = player.etc_data;
//
//   if (etcData?.newr && Array.isArray(etcData.newr)) {
//     currentRating = etcData.newr[etcData.newr.length - 1] ?? 0;
//     ratingDiff = currentRating - player.initial_rating;
//   }
//
//   return {
//     id: player.player_id,
//     name: player.name,
//     firstLast: formatName(player.name),
//     initialRating: player.initial_rating,
//     currentRating,
//     ratingDiff,
//     seed: player.player_id,
//     seedOrdinal: getOrdinal(player.player_id),
//     wins,
//     losses,
//     ties,
//     spread: totalSpread,
//     averageScore,
//     averageScoreRounded: averageScore.toFixed(1),
//     averageOpponentScore,
//     highScore,
//     averageScoreRank: 0, // Will be calculated in calculateAllRanks
//     averageOpponentScoreRank: 0,
//     averageScoreRankOrdinal: "0th",
//     averageOpponentScoreRankOrdinal: "0th",
//     etc: etcData,
//     photo: player.photo,
//   };
// }
//
//
//   export function calculateStatsFromGames(gamesWithPlayers: GameWithPlayers[]): DivisionStats {
//     // Get all unique players
//     const playerMap = new Map<number, PlayerRow>();
//     gamesWithPlayers.forEach(game => {
//       playerMap.set(game.player1.id, game.player1);
//       playerMap.set(game.player2.id, game.player2);
//     });
//     const allPlayers = Array.from(playerMap.values());
//
//     // Calculate individual player stats
//     const playerStats: PlayerStats[] = allPlayers.map(player => {
//       // Get games for this player
//       const playerGames = gamesWithPlayers
//         .filter(game => game.player1.id === player.id || game.player2.id === player.id)
//         .map(game => game.game); // Extract just the GameRow
//
//       // Use existing function to calculate player stats
//       const displayData = calculatePlayerDisplayDataWithRank(player, playerGames, allPlayers);
//
//       // Convert to PlayerStats format
//       return {
//         playerId: player.id,
//         name: player.name,
//         firstLast: displayData.firstLast,
//         initialRating: player.initial_rating,
//         currentRating: displayData.currentRating,
//         ratingDiff: displayData.currentRating - player.initial_rating,
//         seed: displayData.seed,
//         seedOrdinal: getOrdinal(displayData.seed),
//         wins: displayData.wins,
//         losses: displayData.losses,
//         ties: displayData.ties,
//         spread: displayData.spread,
//         averageScore: parseFloat(displayData.averageScoreRounded),
//         averageScoreRounded: displayData.averageScoreRounded,
//         averageOpponentScore: "0", // TODO: Calculate if needed
//         averageScoreRank: 0, // TODO: Calculate if needed
//         averageOpponentScoreRank: 0,
//         averageScoreRankOrdinal: "0th",
//         averageOpponentScoreRankOrdinal: "0th",
//         highScore: displayData.highScore,
//         rank: displayData.rank,
//         rankOrdinal: getOrdinal(displayData.rank),
//         etc: player.etc_data,
//         photo: player.photo || "",
//       };
//     });
//
//     // Calculate division-wide aggregates
//     let totalGamesPlayed = gamesWithPlayers.length;
//     let totalPoints = 0;
//     let winningScores: number[] = [];
//     let losingScores: number[] = [];
//     let higherSeedWins = 0;
//     let goingFirstWins = 0;
//
//     for (const gameWithPlayers of gamesWithPlayers) {
//       const score1 = gameWithPlayers.player1_score!;
//       const score2 = gameWithPlayers.player2_score!;
//
//       totalPoints += score1 + score2;
//
//       // Track winning/losing scores
//       if (score1 > score2) {
//         winningScores.push(score1);
//         losingScores.push(score2);
//       } else if (score2 > score1) {
//         winningScores.push(score2);
//         losingScores.push(score1);
//       }
//
//       // Calculate higher seed wins (lower seed number = higher seed)
//       const higherSeedPlayer = gameWithPlayers.player1.seed < gameWithPlayers.player2.seed ? 1 : 2;
//       const winner = score1 > score2 ? 1 : (score2 > score1 ? 2 : 0);
//       if (winner === higherSeedPlayer) {
//         higherSeedWins++;
//       }
//
//       // Calculate going first wins using etc_data.p12
//       const roundIndex = gameWithPlayers.game.round_number - 1;
//       const player1Etc = gameWithPlayers.player1.etc_data;
//       if (player1Etc?.p12?.[roundIndex] === 1 && score1 > score2) {
//         goingFirstWins++;
//       } else if (player1Etc?.p12?.[roundIndex] === 2 && score2 > score1) {
//         goingFirstWins++;
//       }
//     }
//
//     const averageScore = totalPoints > 0 ? totalPoints / (totalGamesPlayed * 2) : 0;
//     const averageWinningScore = winningScores.length > 0
//       ? winningScores.reduce((sum, score) => sum + score, 0) / winningScores.length
//       : 0;
//     const averageLosingScore = losingScores.length > 0
//       ? losingScores.reduce((sum, score) => sum + score, 0) / losingScores.length
//       : 0;
//     const higherSeedWinPercentage = totalGamesPlayed > 0
//       ? (higherSeedWins / totalGamesPlayed) * 100
//       : 0;
//     const goingFirstWinPercentage = totalGamesPlayed > 0
//       ? (goingFirstWins / totalGamesPlayed) * 100
//       : 0;
//
//     return {
//       playerStats,
//       gamesPlayed: totalGamesPlayed,
//       pointsScored: totalPoints,
//       averageScore: Math.round(averageScore * 100) / 100,
//       averageWinningScore: Math.round(averageWinningScore),
//       averageLosingScore: Math.round(averageLosingScore),
//       higherSeedWinPercentage: Math.round(higherSeedWinPercentage * 10) / 10,
//       goingFirstWinPercentage: Math.round(goingFirstWinPercentage * 10) / 10,
//     };
//   }
//
// // export function calculateStandings(division: Division): PlayerStats[] {
// //   try {
// //     const initialPlayerStats = division.players
// //       .filter(
// //         (playerData): playerData is RawPlayer =>
// //           playerData !== null && playerData !== undefined,
// //       )
// //       .map((playerData) => {
// //         try {
// //           let totalSpread = 0;
// //           let totalScore = 0;
// //           let totalOpponentScore = 0;
// //           let highScore = 0;
// //           let wins = 0;
// //           let losses = 0;
// //           let ties = 0;
// //           let gamesPlayed = 0;
// //
// //           playerData.scores.forEach((score, index) => {
// //             const opponentIdx = playerData.pairings[index];
// //
// //             if (opponentIdx === 0) {
// //               totalSpread += score;
// //               if (score > 0) {
// //                 wins += 1;
// //               } else {
// //                 losses += 1;
// //               }
// //             } else {
// //               const opponent = division.players[opponentIdx];
// //               if (opponent) {
// //                 const opponentScore = opponent.scores[index];
// //                 const spread = score - opponentScore;
// //                 totalSpread += spread;
// //
// //                 if (score > opponentScore) {
// //                   wins += 1;
// //                 } else if (score < opponentScore) {
// //                   losses += 1;
// //                 } else {
// //                   ties += 1;
// //                 }
// //
// //                 totalScore += score;
// //                 totalOpponentScore += opponentScore;
// //                 highScore = Math.max(highScore, score);
// //                 gamesPlayed += 1;
// //               }
// //             }
// //           });
// //
// //           const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;
// //           const averageScoreRounded = averageScore.toFixed(1);
// //
// //           const averageOpponentScore =
// //             gamesPlayed > 0
// //               ? (totalOpponentScore / gamesPlayed).toFixed(1)
// //               : "0";
// //
// //           let currentRating = 0;
// //           let ratingDiff = 0;
// //           try {
// //             if (
// //               playerData.etc &&
// //               playerData.etc.newr &&
// //               Array.isArray(playerData.etc.newr)
// //             ) {
// //               currentRating =
// //                 playerData.etc.newr[playerData.etc.newr.length - 1] ?? 0;
// //               if (isNaN(currentRating)) {
// //                 console.log("Invalid rating for player:", playerData.name);
// //                 currentRating = 0;
// //               }
// //               ratingDiff = currentRating - playerData.rating;
// //             } else {
// //               console.log("Missing rating data for player:", playerData.name);
// //             }
// //           } catch (error) {
// //             console.error(
// //               "Error calculating rating for player:",
// //               playerData.name,
// //               error,
// //             );
// //           }
// //
// //           const stats: PlayerStats = {
// //             id: playerData.id,
// //             name: playerData.name || "Unknown Player",
// //             initialRating: playerData.rating,
// //             currentRating,
// //             ratingDiff,
// //             seed: playerData.id,
// //             seedOrdinal: getOrdinal(playerData.id),
// //             firstLast: formatName(playerData.name),
// //             wins,
// //             losses,
// //             ties,
// //             spread: totalSpread,
// //             averageScore,
// //             averageScoreRounded,
// //             averageOpponentScore,
// //             highScore,
// //             averageScoreRank: 0,
// //             averageOpponentScoreRank: 0,
// //             averageScoreRankOrdinal: "0th",
// //             averageOpponentScoreRankOrdinal: "0th",
// //             etc: playerData.etc,
// //             photo: playerData.photo,
// //           };
// //           return stats;
// //         } catch (error) {
// //           console.error("Error processing player data:", playerData, error);
// //           const defaultStats: PlayerStats = {
// //             id: playerData.id || 0,
// //             name: playerData.name || "Unknown Player",
// //             initialRating: 0,
// //             currentRating: 0,
// //             ratingDiff: 0,
// //             seed: 0,
// //             seedOrdinal: "0th",
// //             firstLast: "Unknown Player",
// //             wins: 0,
// //             losses: 0,
// //             ties: 0,
// //             spread: 0,
// //             averageScore: 0,
// //             averageScoreRounded: "0",
// //             averageOpponentScore: "0",
// //             highScore: 0,
// //             averageScoreRank: 0,
// //             averageOpponentScoreRank: 0,
// //             averageScoreRankOrdinal: "0th",
// //             averageOpponentScoreRankOrdinal: "0th",
// //             etc: playerData.etc,
// //             photo: playerData.photo,
// //           };
// //           return defaultStats;
// //         }
// //       });
// //
// //     // Calculate various rankings
// //     return calculateAllRanks(initialPlayerStats);
// //   } catch (error) {
// //     console.error("Error in calculateStandings:", error);
// //     return [];
// //   }
// // }
//
// interface PlayerDisplayWithoutRank {
//   firstLast: string;
//   averageScoreRounded: string;
//   highScore: number;
//   spread: number;
//   currentRating: number;
//   wins: number;
//   losses: number;
//   ties: number;
//   seed: number;
// }
//
// export function calculateSimplePlayerStats(player: PlayerRow, allGames: GameRow[]): PlayerDisplayWithoutRank {
//   let wins = 0, losses = 0, ties = 0;
//   let totalSpread = 0, totalScore = 0, totalOpponentScore = 0;
//   let highScore = 0, gamesPlayed = 0;
//
//   for (const game of allGames) {
//     // Skip if player not in this game
//     if (game.player1_id !== player.id && game.player2_id !== player.id) continue;
//
//     const isPlayer1 = game.player1_id === player.id;
//     const playerScore = isPlayer1 ? game.player1_score : game.player2_score;
//     const opponentScore = isPlayer1 ? game.player2_score : game.player1_score;
//
//     if (game.is_bye) {
//       if (playerScore !== null) {
//         totalSpread += playerScore;
//         if (playerScore > 0) wins++;
//         else losses++;
//       }
//     } else if (playerScore !== null && opponentScore !== null) {
//       const spread = playerScore - opponentScore;
//       totalSpread += spread;
//
//       if (playerScore > opponentScore) wins++;
//       else if (playerScore < opponentScore) losses++;
//       else ties++;
//
//       totalScore += playerScore;
//       totalOpponentScore += opponentScore;
//       highScore = Math.max(highScore, playerScore);
//       gamesPlayed++;
//     }
//   }
//
//   const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;
//
//   // Get current rating from etc_data
//   let currentRating = 0;
//   if (player.etc_data?.newr && Array.isArray(player.etc_data.newr)) {
//     currentRating = player.etc_data.newr[player.etc_data.newr.length - 1] ?? 0;
//   }
//
//   return {
//     firstLast: formatName(player.name),
//     averageScoreRounded: averageScore.toFixed(1),
//     highScore,
//     spread: totalSpread,
//     currentRating,
//     wins,
//     losses,
//     ties,
//     seed: player.seed,
//   };
// }
//
// export function calculatePlayerDisplayDataWithRank(
//   targetPlayer: PlayerRow,
//   allGames: GameRow[],
//   allPlayers: PlayerRow[]
// ): PlayerDisplayData {
//   // Calculate stats for all players to determine rankings
//   const playerStats: (PlayerDisplayWithoutRank & { id: number })[] = allPlayers.map(player => {
//     const stats = calculateSimplePlayerStats(player, allGames);
//     return { id: player.id, ...stats };
//   });
//
//   // Sort by wins/losses/spread to get rankings
//   const sortedPlayers = playerStats.sort((a, b) => {
//     if (a.wins !== b.wins) return b.wins - a.wins;
//     if (a.losses !== b.losses) return a.losses - b.losses;
//     return b.spread - a.spread;
//   });
//
//   // Find target player's rank
//   const rank = sortedPlayers.findIndex(p => p.id === targetPlayer.id) + 1;
//
//   // Get target player's stats
//   const targetStats = calculateSimplePlayerStats(targetPlayer, allGames);
//
//   return {
//     ...targetStats,
//     rank,
//   };
// }