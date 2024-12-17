import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";

interface StandingsOverlayProps {
  tournamentId: string;
  divisionName: string;
}

interface Column {
  key: keyof PlayerStats;
  label: string;
}

const StandingsOverlay: React.FC<StandingsOverlayProps> = ({
  tournamentId,
  divisionName,
}) => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(
    null,
  );

  const columns: Column[] = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "ties", label: "Ties" },
    { key: "spread", label: "Spread" },
    { key: "averageScore", label: "Avg Pts For" },
    { key: "highScore", label: "High" },
    { key: "ratingDiff", label: "Rating +/-" },
  ];

  const formatNumberWithSign = (value: number) => {
    return value > 0 ? `+${value}` : value.toString();
  };

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

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const tournamentData: ProcessedTournament = await fetchWithAuth(
          `/api/tournaments/${tournamentId}`,
        );

        setTournament(tournamentData);

        const divisionIndex = tournamentData.divisions.findIndex(
          (div) => div.name === divisionName,
        );

        if (divisionIndex === -1) {
          console.error("Division not found");
          return;
        }

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

  if (!standings || !tournament) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="text-black text-4xl font-bold text-center mb-4">
        {tournament.name} {tournament.lexicon} Standings
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-white">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-2 text-${column.key === "name" ? "left" : "right"}`}
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
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((player) => (
              <tr key={player.name} className="bg-white">
                <td className="px-4 py-2 text-right">{player.rank}</td>
                <td className="px-4 py-2">{player.name}</td>
                <td className="px-4 py-2 text-right">{player.wins}</td>
                <td className="px-4 py-2 text-right">{player.losses}</td>
                <td className="px-4 py-2 text-right">{player.ties}</td>
                <td className="px-4 py-2 text-right">
                  {formatNumberWithSign(player.spread)}
                </td>
                <td className="px-4 py-2 text-right">{player.averageScore}</td>
                <td className="px-4 py-2 text-right">{player.highScore}</td>
                <td
                  className={`px-4 py-2 text-right ${player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"}`}
                >
                  {formatNumberWithSign(player.ratingDiff)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsOverlay;
