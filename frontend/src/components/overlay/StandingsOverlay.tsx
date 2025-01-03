import React, { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { API_BASE, fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { MatchWithPlayers } from "@shared/types/admin";

interface CurrentMatchResponse {
  matchData: {
    tournament_id: number;
    division_id: number;
    round: number;
    pairing_id: number;
    updated_at: string;
  };
  tournament: {
    name: string;
    lexicon: string;
  };
  players: Array<{
    id: number;
    name: string;
    rating: number;
    ratingDiff: number;
    firstLast: string;
    [key: string]: any;
  }>;
}

const StandingsOverlay: React.FC = () => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(
    null,
  );
  const [matchWithPlayers, setMatchWithPlayers] =
    useState<CurrentMatchResponse | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
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
      setError("Failed to fetch tournament data. Please try again later.");
    }
  };

  const fetchCurrentMatch = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/overlay/match/current`);
      if (!response.ok) {
        throw new Error("Failed to fetch match data");
      }

      const data: CurrentMatchResponse = await response.json();
      console.log("Current match data:", data);
      setMatchWithPlayers(data);

      if (
        data.matchData?.tournament_id !== undefined &&
        data.matchData?.division_id !== undefined
      ) {
        await fetchTournamentData(
          data.matchData.tournament_id,
          data.matchData.division_id,
        );
      } else {
        console.error("Missing tournament data in match:", data);
        setError("Missing tournament information in current match");
      }
    } catch (err) {
      console.error("Error fetching current match:", err);
      setError("Failed to fetch match data. Please try again later.");
    }
  };

  useEffect(() => {
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
          fetchCurrentMatch();
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

        socketRef.current.on("matchUpdate", (data: CurrentMatchResponse) => {
          console.log("Received match update:", data);
          setMatchWithPlayers(data);
          if (
            data.matchData?.tournament_id !== undefined &&
            data.matchData?.division_id !== undefined
          ) {
            fetchTournamentData(
              data.matchData.tournament_id,
              data.matchData.division_id,
            );
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
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

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
        Standings
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
