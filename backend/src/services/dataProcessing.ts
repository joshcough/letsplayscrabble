import axios from "axios";
import fs from "fs/promises";
import {
  TournamentData,
  Division,
  Player,
  PlayerStats,
  Tournament,
  ProcessedTournament,
} from "../types/tournament";

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

export function calculateStandings(division: Division): PlayerStats[] {
  const PlayerStatss = division.players
    .filter(
      (playerData): playerData is Player =>
        playerData !== null && playerData !== undefined,
    )
    .map((playerData) => {
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

      const averageScore =
        gamesPlayed > 0 ? (totalScore / gamesPlayed).toFixed(2) : 0;

      const res: PlayerStats = {
        id: playerData.id,
        name: playerData.name,
        rating: playerData.etc.newr.at(-1) ?? 0,
        firstLast: formatName(playerData.name),
        wins,
        losses,
        ties,
        spread: totalSpread,
        averageScore,
        highScore,
      };
      return res;
    });

  return calculateRanks(PlayerStatss);
}

function getOrdinal(n: number): string {
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
}

function formatName(name: string): string {
  const [last, first] = name.split(", ");
  return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
}

function calculateRanks(players: PlayerStats[]): PlayerStats[] {
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
}

export function processTournament(tournament: Tournament): ProcessedTournament {
  return {
    ...tournament,
    divisions: tournament.data.divisions,
    standings: tournament.data.divisions.map(calculateStandings),
  };
}
