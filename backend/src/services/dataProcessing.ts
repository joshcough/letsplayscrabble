import axios from "axios";
import fs from "fs/promises";
import { Eq } from "fp-ts/Eq";
import * as S from "fp-ts/lib/Set"; // Note the /lib/ path

import {
  TournamentData,
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
    const PlayerStats = division.players
      .filter(
        (playerData): playerData is RawPlayer =>
          playerData !== null && playerData !== undefined,
      )
      .map((playerData) => {
        try {
          let totalSpread = 0;
          let totalScore = 0;
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
                highScore = Math.max(highScore, score);
                gamesPlayed += 1;
              }
            }
          });

          const averageScore: string =
            gamesPlayed > 0 ? (totalScore / gamesPlayed).toFixed(2) : "0";

          // Add defensive checks for rating calculation
          let rating = 0;
          try {
            if (
              playerData.etc &&
              playerData.etc.newr &&
              Array.isArray(playerData.etc.newr)
            ) {
              rating = playerData.etc.newr[playerData.etc.newr.length - 1] ?? 0;
              if (isNaN(rating)) {
                console.log("Invalid rating for player:", playerData.name);
                rating = 0;
              }
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

          const res: PlayerStats = {
            id: playerData.id,
            name: playerData.name || "Unknown Player",
            rating,
            firstLast: formatName(playerData.name),
            wins,
            losses,
            ties,
            spread: totalSpread,
            averageScore,
            highScore,
          };
          return res;
        } catch (error) {
          console.error("Error processing player data:", playerData, error);
          return {
            id: playerData.id || 0,
            name: playerData.name || "Unknown Player",
            rating: 0,
            firstLast: "Unknown Player",
            wins: 0,
            losses: 0,
            ties: 0,
            spread: 0,
            averageScore: "0",
            highScore: 0,
          };
        }
      });

    return calculateRanks(PlayerStats);
  } catch (error) {
    console.error("Error in calculateStandings:", error);
    return [];
  }
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
