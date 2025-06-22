import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useSocketConnection } from "../../hooks/useSocketConnection";

const HSScoringLeadersOverlay: React.FC = () => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);

  const {
    matchWithPlayers,
    connectionStatus,
    error
  } = useSocketConnection();

  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "averageScoreRounded", label: "Avg Pts For" },
    { key: "averageOpponentScoreScore", label: "Avg Pts Ag" },
    { key: "spread", label: "Spread" },
  ];

  const formatNumberWithSign = (value: number) => {
    return value > 0 ? `+${value}` : value.toString();
  };

  const calculateRanks = (players: PlayerStats[]): PlayerStats[] => {
    const sortedPlayers = [...players].sort((a, b) => {
      return b.averageScore - a.averageScore;
    });

    return sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  };

  const fetchTournamentData = async (
    tournamentId: number,
    divisionId: number,
  ) => {
    try {
      console.log("Fetching tournament data for:", {
        tournamentId,
        divisionId,
      });
      const tournamentData: ProcessedTournament = await fetchWithAuth(
        `/api/tournaments/public/${tournamentId}`,
      );

      setTournament(tournamentData);

      const divisionIndex = divisionId;
      const divisionStandings = calculateRanks(
        tournamentData.standings[divisionIndex],
      );
      setStandings(divisionStandings);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
    }
  };

  // Fetch tournament data when matchWithPlayers changes
  useEffect(() => {
    if (
      matchWithPlayers?.matchData?.tournament_id !== undefined &&
      matchWithPlayers?.matchData?.division_id !== undefined
    ) {
      fetchTournamentData(
        matchWithPlayers.matchData.tournament_id,
        matchWithPlayers.matchData.division_id,
      );
    }
  }, [matchWithPlayers]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
          <p className="text-sm mt-2">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  if (!standings || !tournament || !matchWithPlayers) {
    return <div className="text-black p-2">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-4xl font-bold text-center mb-4">
        {tournament.name} {tournament.lexicon} Div{" "}
        {tournament.divisions[matchWithPlayers.matchData.division_id].name}{" "}
        Scoring Leaders
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
                    minWidth: column.key === "name" ? "200px" : "100px",
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
                <td className="px-4 py-2 text-center">{player.rank}</td>
                <td className="px-4 py-2">{player.etc.firstname1}{ " " }{player.etc.lastname1}</td>
                <td className="px-4 py-2 text-center">
                  {player.averageScoreRounded}
                </td>
                <td className="px-4 py-2 text-center">
                  {player.averageOpponentScore}
                </td>
                <td
                  className={`px-4 py-2 text-center ${
                    player.spread > 0 ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {formatNumberWithSign(player.spread)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HSScoringLeadersOverlay;