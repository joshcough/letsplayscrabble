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
} from "@shared/types/tournament";

import { eqPairing } from "./tournamentInstances";
import { formatName } from "./statsCalculations";

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
    etc: p.etc
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

// // Re-export calculateStandings from statsCalculations
// export { calculateStandings };

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