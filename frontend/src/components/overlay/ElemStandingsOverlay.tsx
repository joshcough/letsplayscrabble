import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useSocketConnection } from "../../hooks/useSocketConnection";

type RouteParams = {
  [key: string]: string | undefined;
  tournamentId: string;
  divisionName: string;
}

const ElemStandingsOverlay: React.FC = () => {
  console.log("Component rendering"); // Debug log

  const { tournamentId, divisionName } = useParams();
  console.log("URL params:", { tournamentId, divisionName }); // Debug log

  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    matchWithPlayers,
    connectionStatus
  } = useSocketConnection();

  const columns = [
    { key: "name", label: "Name" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "ties", label: "Ties" },
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High Score" },
  ];

  const formatNumberWithSign = (value: number | null) => {
    if (value === null) return '';
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

  const fetchTournamentData = async () => {
    try {
      if (!tournamentId) {
        throw new Error("Tournament ID is required");
      }

      console.log("Fetching tournament data for:", { tournamentId, divisionName });
      const tournamentData: ProcessedTournament = await fetchWithAuth(
        `/api/tournaments/public/${tournamentId}`
      );
      console.log("Received tournament data:", tournamentData); // Debug log

      setTournament(tournamentData);

      // Find the index of the division in the standings array that matches our division name
      const divisionIndex = tournamentData.divisions.findIndex(
        div => div.name.toUpperCase() === divisionName?.toUpperCase()
      );
      console.log("Division index:", divisionIndex); // Debug log

      if (divisionIndex === -1) {
        throw new Error(`Division ${divisionName} not found in tournament`);
      }

      console.log("Standings for division:", tournamentData.standings[divisionIndex]); // Debug log
      const divisionStandings = calculateRanks(
        tournamentData.standings[divisionIndex]
      );
      setStandings(divisionStandings);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setError(`Failed to fetch tournament data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Initial fetch on mount and when params change
  useEffect(() => {
    console.log("Running tournament data fetch effect"); // Debug log
    fetchTournamentData();
  }, [tournamentId, divisionName]);

  // Listen for socket updates and refresh if relevant to this tournament/division
  useEffect(() => {
    if (
      matchWithPlayers?.matchData?.tournament_id === Number(tournamentId) &&
      tournament?.divisions[matchWithPlayers.matchData.division_id]?.name?.toUpperCase() === divisionName?.toUpperCase()
    ) {
      console.log("Received relevant match update, refreshing data");
      fetchTournamentData();
    }
  }, [matchWithPlayers, tournamentId, divisionName, tournament]);

  if (error) {
    console.log("Rendering error state:", error); // Debug log
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
          <p className="text-sm mt-2">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  if (!standings || !tournament) {
    console.log("Rendering loading state"); // Debug log
    return <div className="text-black p-2">Loading...</div>;
  }

  const divisionIndex = tournament.divisions.findIndex(
    div => div.name.toUpperCase() === divisionName?.toUpperCase()
  );

  console.log("Rendering standings table"); // Debug log
  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-4xl font-bold text-center mb-4">
        {tournament.name} {tournament.lexicon} Div{" "}
        {tournament.divisions[divisionIndex].name} Standings
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-white">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-2 ${column.key === "name" ? "text-left" : "text-center"}`}
                  style={{
                    minWidth:
                      column.key === "name"
                        ? "200px"
                        : ["wins", "losses", "ties"].includes(column.key)
                          ? "50px"
                          : ["rank"].includes(column.key)
                            ? "50px"
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
                <td className="px-4 py-2">{player.etc.firstname1.join(" ")}{" & "}{player.etc.firstname2.join(" ")}</td>
                <td className="px-4 py-2 text-center">{player.wins}</td>
                <td className="px-4 py-2 text-center">{player.losses}</td>
                <td className="px-4 py-2 text-center">{player.ties}</td>
                <td className="px-4 py-2 text-center">
                  {formatNumberWithSign(player.spread)}
                </td>
                <td className="px-4 py-2 text-center">{player.highScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ElemStandingsOverlay;