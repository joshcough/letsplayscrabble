import React from "react";

import * as Domain from "@shared/types/domain";
import {
  BaseOverlay,
} from "../components/shared/BaseOverlay";
import { ApiService } from "../services/interfaces";
import * as Stats from "../types/stats";
import { calculateStandingsFromGames } from "../utils/calculateStandings";

// Type for PlayerStats with rank added
export type RankedPlayerStats = Stats.PlayerStats & { rank: number };

// All supported sort types
export type SortType =
  | "standings"
  | "highScore"
  | "averageScore"
  | "ratingGain";

interface PlayerStatsData {
  tournament: Domain.Tournament;
  players: RankedPlayerStats[];
  divisionName: string;
  loading: boolean;
  error: string | null;
}

interface UsePlayerStatsCalculationProps {
  sortType: SortType;
  apiService: ApiService;
  children: (data: PlayerStatsData) => React.ReactNode;
}

// Sorting functions for different overlay types
const sortPlayersBySortType = (
  players: Stats.PlayerStats[],
  sortType: SortType,
): RankedPlayerStats[] => {
  let sortedPlayers: Stats.PlayerStats[];

  switch (sortType) {
    case "standings":
      // Sort by wins (desc), losses (asc), spread (desc)
      sortedPlayers = [...players].sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.spread - a.spread;
      });
      break;

    case "highScore":
      // Sort by high score (desc)
      sortedPlayers = [...players].sort((a, b) => b.highScore - a.highScore);
      break;

    case "averageScore":
      // Sort by average score (desc)
      sortedPlayers = [...players].sort(
        (a, b) => b.averageScore - a.averageScore,
      );
      break;

    case "ratingGain":
      // Sort by rating difference (desc)
      sortedPlayers = [...players].sort((a, b) => b.ratingDiff - a.ratingDiff);
      break;

    default:
      console.warn(`Unknown sort type: ${sortType}, defaulting to standings`);
      sortedPlayers = [...players].sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.spread - a.spread;
      });
  }

  // Add rank to each player
  return sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
};

export const UsePlayerStatsCalculation: React.FC<
  UsePlayerStatsCalculationProps
> = ({ sortType, apiService, children }) => {
  return (
    <BaseOverlay apiService={apiService}>
      {({ tournament, divisionData, divisionName }) => {
        console.log("🔢 UsePlayerStatsCalculation: Calculating stats", {
          tournament: tournament.name,
          tournamentId: tournament.id,
          divisionName,
          sortType,
          players: divisionData.players.length,
          games: divisionData.games.length,
        });

        // Calculate basic stats from raw games (same for all overlays)
        const playerStats = calculateStandingsFromGames(
          divisionData.games,
          divisionData.players,
        );

        // Apply sorting specific to this overlay type
        const rankedPlayers = sortPlayersBySortType(playerStats, sortType);

        console.log(
          "✅ UsePlayerStatsCalculation: Calculated",
          rankedPlayers.length,
          "ranked players for",
          sortType,
        );

        return children({
          tournament,
          players: rankedPlayers,
          divisionName,
          loading: false,
          error: null,
        });
      }}
    </BaseOverlay>
  );
};
