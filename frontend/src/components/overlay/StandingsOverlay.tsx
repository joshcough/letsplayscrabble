import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useGamesAdded } from "../../utils/socketHelpers";
import { fetchTournament } from "../../utils/tournamentApi";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

type RouteParams = {
  [key: string]: string | undefined;
  tournamentId: string;
  divisionName: string;
}

const StandingsOverlay: React.FC = () => {
  console.log("Component rendering"); // Debug log

  const { tournamentId, divisionName } = useParams<RouteParams>();
  console.log("URL params:", { tournamentId, divisionName }); // Debug log

  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { socket } = useSocketConnection();

  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "ties", label: "Ties" },
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High" },
  ];

  // Calculate ranks based on wins/losses/spread (same as other standings)
  const calculateStandingsRanks = (players: PlayerStats[]): PlayerStats[] => {
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

      setLoading(true);
      setFetchError(null);

      console.log("Fetching tournament data for:", { tournamentId, divisionName });
      const tournamentData = await fetchTournament(Number(tournamentId));
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
      const divisionStandings = calculateStandingsRanks(
        tournamentData.standings[divisionIndex]
      );
      setStandings(divisionStandings);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount and when params change
  useEffect(() => {
    console.log("Running tournament data fetch effect"); // Debug log
    fetchTournamentData();
  }, [tournamentId, divisionName]);

  // Listen for games being added to this tournament
  useGamesAdded(socket, (data: { tournamentId: number }) => {
    if (data.tournamentId === Number(tournamentId)) {
      console.log("Games added to our tournament, refreshing data");
      fetchTournamentData();
    }
  });

  // Show loading state
  if (loading) {
    console.log("Rendering loading state"); // Debug log
    return <div className="text-black p-2">Loading...</div>;
  }

  // Show errors
  if (fetchError) {
    console.log("Rendering error state:", fetchError); // Debug log
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{fetchError}</p>
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
                <td className="px-4 py-2 text-center">{player.rank}</td>
                <td className="px-4 py-2">{player.name}</td>
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

export default StandingsOverlay;