import axios from "axios";
import fs from "fs/promises";
import { Eq } from "fp-ts/Eq";
import * as S from "fp-ts/lib/Set"; // Note the /lib/ path

import {
  TournamentData,
  GameResult,
  Division,
  Pairing,
  PlayerData,
  PlayerStats,
  RawPlayer,
  RoundPairings,
  Tournament,
  ProcessedTournament,
} from "@shared/types/tournament";

import { eqPairing } from "./tournamentInstances";

export async function loadTournamentFile(
  source: string,
): Promise<TournamentData> {
  try {
    let jsContent: string;

    // Check if it's a URL or local file
    if (source.startsWith("http")) {
      // Handle remote file
      const response = await axios.get(source, {
        timeout: 25000,
        transformResponse: [(data: string) => data],
      });
      jsContent = response.data;
    } else {
      // Handle local file
      jsContent = await fs.readFile(source, "utf-8");
    }

    // Create a new Function that returns the object portion
    const objectText = jsContent.substring(jsContent.indexOf("{"));
    const evaluator = new Function("return " + objectText);
    const data = evaluator();

    if (!data || !data.divisions) {
      throw new Error("Could not parse tournament data from the JS file.");
    }

    return data as TournamentData;
  } catch (error) {
    console.error("Error loading tournament file:", error);
    throw error;
  }
}

export function playerDataFromRawData(p: RawPlayer) {
  const playerData: PlayerData = {
    id: p.id,
    name: p.name,
    firstLast: formatName(p.name),
  };
  return playerData;
}

export function calculatePairings(division: Division): RoundPairings[] {
  const playerDataList = division.players
    .filter(
      (playerData): playerData is RawPlayer =>
        playerData !== null && playerData !== undefined,
    )
    .map(playerDataFromRawData);

  const pairingsArray: Pairing[][] = division.players
    .filter(
      (playerData): playerData is RawPlayer =>
        playerData !== null && playerData !== undefined,
    )
    .map((p) => {
      return p.pairings
        .map((id, index) => ({
          id,
          index: index + 1,
          isFirstPlayer: p.etc.p12[index] === 1,
        }))
        .filter(({ id }) => id > 0) // filter out byes (0)
        .map(({ id: pairingId, index, isFirstPlayer }) => {
          const currentPlayer = playerDataList[p.id - 1];
          const otherPlayer = playerDataList[pairingId - 1];

          // Determine player order based on p12 value
          const pairing: Pairing = {
            round: index,
            player1: isFirstPlayer ? currentPlayer : otherPlayer,
            player2: isFirstPlayer ? otherPlayer : currentPlayer,
          };
          return pairing;
        });
    });

  const flatPairings: Pairing[] = pairingsArray.flat();
  const pairingsSet = S.fromArray<Pairing>(eqPairing)(flatPairings);

  const sortedPairings = sortAndGroupByRound([...pairingsSet]);

  const res = [...sortedPairings].map(([round, pairingsSet]) => ({
    round: round,
    divisionName: division.name,
    pairings: [...pairingsSet],
  }));

  return res;
}

function sortAndGroupByRound(items: Pairing[]): Map<number, Pairing[]> {
  // First sort the items by round number
  const sortedItems = [...items].sort((a, b) => a.round - b.round);

  // Create a Map to store the grouped items
  const groupedByRound = new Map<number, Pairing[]>();

  // Group items by round
  sortedItems.forEach((item) => {
    if (!groupedByRound.has(item.round)) {
      groupedByRound.set(item.round, []);
    }
    groupedByRound.get(item.round)!.push(item);
  });

  return groupedByRound;
}

export function calculateStandings(division: Division): PlayerStats[] {
  try {
    const initialPlayerStats = division.players
      .filter(
        (playerData): playerData is RawPlayer =>
          playerData !== null && playerData !== undefined,
      )
      .map((playerData) => {
        try {
          let totalSpread = 0;
          let totalScore = 0;
          let totalOpponentScore = 0;
          let highScore = 0;
          let wins = 0;
          let losses = 0;
          let ties = 0;
          let gamesPlayed = 0;

          playerData.scores.forEach((score, index) => {
            const opponentIdx = playerData.pairings[index];

            if (opponentIdx === 0) {
              totalSpread += score;
              if (score > 0) {
                wins += 1;
              } else {
                losses += 1;
              }
            } else {
              const opponent = division.players[opponentIdx];
              if (opponent) {
                const opponentScore = opponent.scores[index];
                const spread = score - opponentScore;
                totalSpread += spread;

                if (score > opponentScore) {
                  wins += 1;
                } else if (score < opponentScore) {
                  losses += 1;
                } else {
                  ties += 1;
                }

                totalScore += score;
                totalOpponentScore += opponentScore;
                highScore = Math.max(highScore, score);
                gamesPlayed += 1;
              }
            }
          });

          const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;
          const averageScoreRounded = averageScore.toFixed(1);

          const averageOpponentScore =
            gamesPlayed > 0
              ? (totalOpponentScore / gamesPlayed).toFixed(1)
              : "0";

          let currentRating = 0;
          let ratingDiff = 0;
          try {
            if (
              playerData.etc &&
              playerData.etc.newr &&
              Array.isArray(playerData.etc.newr)
            ) {
              currentRating =
                playerData.etc.newr[playerData.etc.newr.length - 1] ?? 0;
              if (isNaN(currentRating)) {
                console.log("Invalid rating for player:", playerData.name);
                currentRating = 0;
              }
              ratingDiff = currentRating - playerData.rating;
            } else {
              console.log("Missing rating data for player:", playerData.name);
            }
          } catch (error) {
            console.error(
              "Error calculating rating for player:",
              playerData.name,
              error,
            );
          }

          const stats: PlayerStats = {
            id: playerData.id,
            name: playerData.name || "Unknown Player",
            initialRating: playerData.rating,
            currentRating,
            ratingDiff,
            seed: playerData.id,
            seedOrdinal: getOrdinal(playerData.id),
            firstLast: formatName(playerData.name),
            wins,
            losses,
            ties,
            spread: totalSpread,
            averageScore,
            averageScoreRounded,
            averageOpponentScore,
            highScore,
            averageScoreRank: 0,
            averageOpponentScoreRank: 0,
            averageScoreRankOrdinal: "0th",
            averageOpponentScoreRankOrdinal: "0th",
          };
          return stats;
        } catch (error) {
          console.error("Error processing player data:", playerData, error);
          const defaultStats: PlayerStats = {
            id: playerData.id || 0,
            name: playerData.name || "Unknown Player",
            initialRating: 0,
            currentRating: 0,
            ratingDiff: 0,
            seed: 0,
            seedOrdinal: "0th",
            firstLast: "Unknown Player",
            wins: 0,
            losses: 0,
            ties: 0,
            spread: 0,
            averageScore: 0,
            averageScoreRounded: "0",
            averageOpponentScore: "0",
            highScore: 0,
            averageScoreRank: 0,
            averageOpponentScoreRank: 0,
            averageScoreRankOrdinal: "0th",
            averageOpponentScoreRankOrdinal: "0th",
          };
          return defaultStats;
        }
      });

    // Calculate various rankings
    return calculateAllRanks(initialPlayerStats);
  } catch (error) {
    console.error("Error in calculateStandings:", error);
    return [];
  }
}

function calculateAllRanks(players: PlayerStats[]): PlayerStats[] {
  // First calculate win/loss/spread ranks
  const playersByWins = [...players].sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.spread - a.spread;
  });

  // Calculate average score ranks (higher is better)
  const playersByAvgScore = [...players].sort((a, b) => {
    return b.averageScore - a.averageScore;
  });

  // Calculate opponent score ranks (lower is better)
  const playersByOpponentScore = [...players].sort((a, b) => {
    return (
      parseFloat(a.averageOpponentScore) - parseFloat(b.averageOpponentScore)
    );
  });

  // Create maps for all rankings
  const rankMap = new Map<number, number>();
  const avgScoreRankMap = new Map<number, number>();
  const avgOpponentScoreRankMap = new Map<number, number>();

  playersByWins.forEach((player, index) => {
    rankMap.set(player.id, index + 1);
  });

  playersByAvgScore.forEach((player, index) => {
    avgScoreRankMap.set(player.id, index + 1);
  });

  playersByOpponentScore.forEach((player, index) => {
    avgOpponentScoreRankMap.set(player.id, index + 1);
  });

  // Apply all rankings to players
  return players.map((player) => {
    const averageScoreRank = avgScoreRankMap.get(player.id) ?? 0;
    const averageOpponentScoreRank =
      avgOpponentScoreRankMap.get(player.id) ?? 0;
    const rank = rankMap.get(player.id) ?? 0;

    return {
      ...player,
      rank,
      rankOrdinal: getOrdinal(rank),
      averageScoreRank,
      averageScoreRankOrdinal: getOrdinal(averageScoreRank),
      averageOpponentScoreRank,
      averageOpponentScoreRankOrdinal: getOrdinal(averageOpponentScoreRank),
    };
  });
}

function getOrdinal(n: number): string {
  try {
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return n + "th";
    }

    switch (lastDigit) {
      case 1:
        return n + "st";
      case 2:
        return n + "nd";
      case 3:
        return n + "rd";
      default:
        return n + "th";
    }
  } catch (error) {
    console.error("Error in getOrdinal:", error);
    return n + "th";
  }
}

function formatName(name: string | undefined): string {
  try {
    if (!name) {
      console.log("Name is null or empty");
      return "Unknown Player";
    }

    if (!name.includes(",")) {
      console.log("Name doesn't contain comma:", name);
      return name;
    }

    const [last, first] = name.split(", ");
    if (!first || !last) {
      console.log("Invalid name format after split:", { last, first });
      return name;
    }

    return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
  } catch (error) {
    console.error("Error formatting name:", name, error);
    return "Unknown Player";
  }
}

function calculateRanks(players: PlayerStats[]): PlayerStats[] {
  try {
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.spread - a.spread;
    });

    const rankMap = new Map<number, number>();
    sortedPlayers.forEach((player, index) => {
      rankMap.set(player.id, index + 1);
    });

    return players.map((player) => {
      const rank = rankMap.get(player.id) ?? 0;
      return {
        ...player,
        rank,
        rankOrdinal: getOrdinal(rank),
      };
    });
  } catch (error) {
    console.error("Error in calculateRanks:", error);
    return players.map((player) => ({
      ...player,
      rank: 0,
      rankOrdinal: "0th",
    }));
  }
}

export function processTournament(tournament: Tournament): ProcessedTournament {
  try {
    return {
      ...tournament,
      divisions: tournament.data.divisions,
      standings: tournament.data.divisions.map(calculateStandings),
      divisionPairings: tournament.data.divisions.map(calculatePairings),
    };
  } catch (error) {
    console.error("Error processing tournament:", error);
    return {
      ...tournament,
      divisions: [],
      standings: [],
      divisionPairings: [],
    };
  }
}

export function getPlayerRecentGames(
  division: Division,
  playerId: number,
): GameResult[] {
  try {
    // Find the player in the division
    const player = division.players.find((p) => p?.id === playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found in division`);
    }

    const allGames: GameResult[] = [];

    // First collect all played games
    for (
      let roundIndex = 0;
      roundIndex < player.pairings.length;
      roundIndex++
    ) {
      const opponentId = player.pairings[roundIndex];
      const playerScore = player.scores[roundIndex];

      // Skip byes (opponent ID of 0)
      if (opponentId === 0) continue;

      // Find opponent in the original players array
      const opponent =
        opponentId === playerId
          ? player // If the opponent is the same as the player
          : division.players.find((p) => p?.id === opponentId); // Otherwise find them in the array

      if (!opponent) continue;

      const opponentScore = opponent.scores[roundIndex];
      if (opponentScore === undefined) continue;

      allGames.push({
        round: roundIndex + 1,
        opponentName: formatName(opponent.name),
        playerScore,
        opponentScore,
      });
    }

    // Return the last 5 (or fewer) games
    return allGames.slice(-5);
  } catch (error) {
    console.error("Error getting recent games:", error);
    return [];
  }
}
