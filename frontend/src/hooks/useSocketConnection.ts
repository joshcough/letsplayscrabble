import { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { API_BASE } from "../config/api";
import { CurrentMatch } from "@shared/types/currentMatch";
import { MatchWithPlayers } from "@shared/types/admin";

interface UseSocketConnectionReturn {
  matchWithPlayers: MatchWithPlayers | null;
  connectionStatus: string;
  error: string | null;
  lastDataUpdate: number;
  refetchCurrentMatch: () => Promise<void>;
}

export const useSocketConnection = (): UseSocketConnectionReturn => {
  const [matchWithPlayers, setMatchWithPlayers] = useState<MatchWithPlayers | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(Date.now());

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const fetchCurrentMatch = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/overlay/match/current`);
      if (!response.ok) {
        throw new Error("Failed to fetch match data");
      }

      const data: CurrentMatch = await response.json();
      console.log("Current match data:", data);
      setMatchWithPlayers(data);
      setLastDataUpdate(Date.now());

      if (
        data.matchData?.tournament_id === undefined ||
        data.matchData?.division_id === undefined
      ) {
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

      socketRef.current.on("AdminPanelUpdate", (data: MatchWithPlayers) => {
        console.log("Received match update:", data);
        setMatchWithPlayers(data);
        setLastDataUpdate(Date.now());
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

  return {
    matchWithPlayers,
    connectionStatus,
    error,
    lastDataUpdate,
    refetchCurrentMatch: fetchCurrentMatch,
  };
};