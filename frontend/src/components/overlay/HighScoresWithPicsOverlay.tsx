import React, { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { API_BASE, fetchWithAuth } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { MatchWithPlayers } from "@shared/types/admin";

const baseUrl = "https://scrabbleplayers.org/directors/AA003954/";

const getTournamentName = (tourney_url: string): string => {
  const suffix = "/html/tourney.js";
  return tourney_url.slice(baseUrl.length, -suffix.length);
};

const getPlayerImageUrl = (tourney_url: string, player_photo: string): string => {
  return baseUrl + getTournamentName(tourney_url) + "/html/" + player_photo;
}

const formatPlayerName = (name: string): string => {
  if (!name.includes(',')) { return name; }
  const parts = name.split(',').map(part => part.trim());
  // Return original if format is unexpected
  if (parts.length !== 2 || !parts[0] || !parts[1]) { return name; }
  const [lastName, firstName] = parts;
  return `${firstName} ${lastName}`;
};

const HighScoresWithPicsOverlay: React.FC = () => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(
    null,
  );
  const [matchWithPlayers, setMatchWithPlayers] =
    useState<MatchWithPlayers | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(Date.now());

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const calculateRanks = (players: PlayerStats[]): PlayerStats[] => {
    const sortedPlayers = [...players].sort((a, b) => {
      return b.highScore - a.highScore; // Sort by high score instead of average
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

      const data: MatchWithPlayers = await response.json();
      console.log("Current match data:", data);
      setMatchWithPlayers(data);
      setLastDataUpdate(Date.now());

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

  const startPollingFallback = () => {
    console.log("Starting HTTP polling fallback");

    const pollInterval = setInterval(async () => {
      try {
        await fetchCurrentMatch();
        setConnectionStatus("Connected via HTTP polling");
        setError(null);
      } catch (error) {
        console.error("Polling failed:", error);
        setConnectionStatus("Polling failed, retrying socket...");
        clearInterval(pollInterval);

        // Try socket connection again
        setTimeout(connectSocket, 5000);
      }
    }, 10000); // Poll every 10 seconds

    // Store interval to clean up later
    reconnectTimeout.current = pollInterval;
  };

  const connectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      socketRef.current = io(API_BASE, {
        transports: ["polling", "websocket"],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Never stop trying
        timeout: 20000,
        forceNew: true,
        withCredentials: true,
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected");
        setConnectionStatus("Connected to server");
        setError(null); // Clear any previous errors
        reconnectAttempts.current = 0;
        setLastDataUpdate(Date.now());
        fetchCurrentMatch();
      });

      socketRef.current.on("connect_error", (error: Error) => {
        console.error("Socket connect error:", error);
        setConnectionStatus(`Connection error: ${error.message}`);
        reconnectAttempts.current += 1;

        // If we've tried many times, fall back to polling
        if (reconnectAttempts.current > 10) {
          console.log("Falling back to HTTP polling");
          startPollingFallback();
        }
      });

      socketRef.current.on("disconnect", (reason: string) => {
        console.log("Socket disconnected:", reason);
        setConnectionStatus(`Disconnected from server: ${reason}`);

        // Always try to reconnect
        if (reason === "io server disconnect" || reason === "ping timeout") {
          setTimeout(() => {
            console.log("Attempting manual reconnection...");
            socketRef.current?.connect();
          }, 2000);
        }
      });

      socketRef.current.on("matchUpdate", (data: MatchWithPlayers) => {
        console.log("Received match update:", data);
        setMatchWithPlayers(data);
        setLastDataUpdate(Date.now());

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

      // Add ping/pong handling
      socketRef.current.on("ping", () => {
        console.log("Received ping");
        setLastDataUpdate(Date.now());
      });

    } catch (error) {
      const err = error as Error;
      console.error("Socket initialization error:", err);
      setError(`Socket initialization failed: ${err.message}`);
      setConnectionStatus(`Failed to initialize socket connection`);

      // Retry connection after delay
      setTimeout(connectSocket, 5000);
    }
  };

  const startHealthCheck = () => {
    healthCheckInterval.current = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastDataUpdate;
      const maxIdleTime = 60000; // 1 minute

      if (timeSinceLastUpdate > maxIdleTime) {
        console.log("No data received for too long, reconnecting...");
        setConnectionStatus("Reconnecting due to inactivity...");

        // Force reconnection
        if (socketRef.current) {
          socketRef.current.disconnect();
          setTimeout(connectSocket, 1000);
        }
      }
    }, 30000); // Check every 30 seconds
  };

  useEffect(() => {
    connectSocket();
    startHealthCheck();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }

      if (reconnectTimeout.current) {
        clearInterval(reconnectTimeout.current);
      }
    };
  }, []);

  // Add window focus handler to reconnect when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && socketRef.current?.connected === false) {
        console.log("Page became visible, checking connection...");
        connectSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  // Get top 5 players by high score
  const top5Players = standings.slice(0, 5);

  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-6xl font-bold text-center mb-4">
        High Scores
      </div>

      <div className="text-black text-4xl font-bold text-center mb-8">
        {tournament.name} {tournament.lexicon} Div{" "}
        {tournament.divisions[matchWithPlayers.matchData.division_id].name}{" "}
      </div>

      <div className="flex justify-center items-end gap-8 px-4">
        {top5Players.map((player, index) => (
          <div key={player.name} className="flex flex-col items-center">
            {/* Player Image */}
            <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden border-4 border-gray-300 bg-gray-200">
              <img
                src={getPlayerImageUrl(tournament.data_url, player.photo)}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Player Name */}
            <div className="text-black text-xl font-bold text-center mb-2 max-w-40">
              {formatPlayerName(player.name)}
            </div>

            {/* High Score */}
            <div className="text-black text-3xl font-bold text-center">
              {player.highScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighScoresWithPicsOverlay;