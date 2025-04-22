import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { API_BASE, fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";

type RouteParams = {
  [key: string]: string | undefined;
  tournamentId: string;
  divisionName: string;
}

const StandingsOverlay: React.FC = () => {
  console.log("Component rendering"); // Debug log

  const { tournamentId, divisionName } = useParams();
  console.log("URL params:", { tournamentId, divisionName }); // Debug log

  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...");
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;

  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "ties", label: "Ties" },
    { key: "spread", label: "Spread" },
    { key: "averageScoreRounded", label: "Avg Pts For" },
    { key: "averageOpponentScore", label: "Avg Pts Ag" },
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

  useEffect(() => {
    console.log("Running tournament data fetch effect"); // Debug log
    fetchTournamentData();
  }, [tournamentId, divisionName]);

  useEffect(() => {
    console.log("Running socket connection effect"); // Debug log
    const connectSocket = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      try {
        socketRef.current = io(API_BASE, {
          transports: ["polling", "websocket"],
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: maxReconnectAttempts,
          timeout: 20000,
          forceNew: true,
          withCredentials: true,
        });

        socketRef.current.on("connect", () => {
          console.log("Socket connected");
          setConnectionStatus("Connected to server");
          reconnectAttempts.current = 0;
        });

        socketRef.current.on("connect_error", (error: Error) => {
          console.error("Socket connect error:", error);
          setConnectionStatus(`Connection error: ${error.message}`);
          reconnectAttempts.current += 1;
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            socketRef.current?.disconnect();
          }
        });

        socketRef.current.on("disconnect", (reason: string) => {
          console.log("Socket disconnected:", reason);
          setConnectionStatus(`Disconnected from server: ${reason}`);
          if (reason === "io server disconnect") {
            socketRef.current?.connect();
          }
        });

        socketRef.current.on("matchUpdate", (data: any) => {
          console.log("Received match update:", data);
          // Only update if the match is for our tournament and division
          if (
            data.matchData?.tournament_id === Number(tournamentId) &&
            data.division?.name?.toUpperCase() === divisionName?.toUpperCase()
          ) {
            fetchTournamentData();
          }
        });

        socketRef.current.on("error", (error: Error) => {
          console.error("Socket error:", error);
          setError(`Socket error: ${error.message}`);
        });
      } catch (error) {
        const err = error as Error;
        console.error("Socket initialization error:", err);
        setError(`Socket initialization failed: ${err.message}`);
        setConnectionStatus(`Failed to initialize socket connection`);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection"); // Debug log
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [tournamentId, divisionName]);

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
                <td className="px-4 py-2 text-center">{player.rank}</td>
                <td className="px-4 py-2">{player.name}</td>
                <td className="px-4 py-2 text-center">{player.wins}</td>
                <td className="px-4 py-2 text-center">{player.losses}</td>
                <td className="px-4 py-2 text-center">{player.ties}</td>
                <td className="px-4 py-2 text-center">
                  {formatNumberWithSign(player.spread)}
                </td>
                <td className="px-4 py-2 text-center">
                  {player.averageScoreRounded}
                  <span className="mx-2"></span>(
                  {player.averageScoreRankOrdinal})
                </td>
                <td className="px-4 py-2 text-center">
                  {player.averageOpponentScore}
                  <span className="mx-2"></span>(
                  {player.averageOpponentScoreRankOrdinal})
                </td>
                <td className="px-4 py-2 text-center">{player.highScore}</td>
                <td
                  className={`px-4 py-2 text-center ${
                    player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"
                  }`}
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