import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";

interface TournamentStandingsProps {
  tournamentId?: string;
  divisionName: string;
}

interface SortConfig {
  key: keyof PlayerStats;
  direction: "asc" | "desc";
}

interface Column {
  key: keyof PlayerStats;
  label: string;
  sortable: boolean;
}

const TournamentStandings: React.FC<TournamentStandingsProps> = ({
  tournamentId,
  divisionName,
}) => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "rank",
    direction: "asc",
  });

  const columns: Column[] = [
    { key: "rank", label: "Rank", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "wins", label: "W", sortable: true },
    { key: "losses", label: "L", sortable: true },
    { key: "ties", label: "T", sortable: true },
    { key: "spread", label: "Spread", sortable: true },
    { key: "averageScore", label: "Average", sortable: true },
    { key: "highScore", label: "High", sortable: true },
    { key: "ratingDiff", label: "Rating Change", sortable: true },
  ];

  const calculateRanks = (players: PlayerStats[]): PlayerStats[] => {
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.spread - a.spread;
    });

    return sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  };

  const sortData = (
    data: PlayerStats[],
    sortConfig: SortConfig,
  ): PlayerStats[] => {
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === b[sortConfig.key]) {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.spread - a.spread;
      }

      // Handle different types appropriately
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // For strings
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const handleSort = (key: keyof PlayerStats) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const getSortDirection = (key: keyof PlayerStats): string => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "↑" : "↓";
    }
    return "";
  };

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const tournamentData: ProcessedTournament = await fetchWithAuth(
          `/api/tournaments/${tournamentId}`,
        );

        // Find the correct division
        const divisionIndex = tournamentData.divisions.findIndex(
          (div) => div.name === divisionName,
        );

        if (divisionIndex === -1) {
          console.error("Division not found");
          return;
        }

        // Get and rank the standings for the specific division
        const divisionStandings = calculateRanks(
          tournamentData.standings[divisionIndex],
        );
        setStandings(divisionStandings);
      } catch (error) {
        console.error("Error fetching standings:", error);
      }
    };

    if (tournamentId && divisionName) {
      fetchStandings();
    }
  }, [tournamentId, divisionName]);

  if (!standings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-2 border ${
                  column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
                style={{
                  minWidth:
                    column.key === "name"
                      ? "200px"
                      : ["wins", "losses", "ties"].includes(column.key)
                        ? "80px"
                        : ["rank"].includes(column.key)
                          ? "80px"
                          : "100px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className="ml-1 w-4 inline-block">
                      {getSortDirection(column.key)}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortData(standings, sortConfig).map((player, index) => (
            <tr
              key={player.name}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-2 border">{player.rank}</td>
              <td className="px-4 py-2 border">{player.name}</td>
              <td className="px-4 py-2 text-center border">{player.wins}</td>
              <td className="px-4 py-2 text-center border">{player.losses}</td>
              <td className="px-4 py-2 text-center border">{player.ties}</td>
              <td className="px-4 py-2 text-right border">{player.spread}</td>
              <td className="px-4 py-2 text-right border">
                {player.averageScore}
              </td>
              <td className="px-4 py-2 text-right border">
                {player.highScore}
              </td>
              <td className="px-4 py-2 text-right border">
                {player.ratingDiff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TournamentStandings;
