import React, { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import { API_BASE } from "../config/api";

const StatsOverlay = () => {
  const [matchData, setMatchData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const fetchCurrentMatch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/admin/match/current`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch match data");
        }

        setMatchData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching current match:", err);
        setError("Failed to fetch current match. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    const connectSocket = () => {
      console.log("Debug info:", {
        API_BASE,
        currentEnvironment: process.env.NODE_ENV,
        existingSocket: socketRef.current ? 'exists' : 'none'
      });

      if (socketRef.current) {
        console.log("Cleaning up existing socket connection");
        socketRef.current.disconnect();
      }

      try {
        console.log("Attempting to connect to:", API_BASE);

        socketRef.current = io(API_BASE, {
          transports: ["polling", "websocket"],  // Try polling first
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: maxReconnectAttempts,
          timeout: 20000,  // Increase timeout
          forceNew: true,  // Force a new connection
          withCredentials: true,
        });

        // Add this to see the transport method being used
        socketRef.current.on("connect", () => {
          console.log("Connected with transport:", socketRef.current.io.engine.transport.name);
          console.log("Socket connected with ID:", socketRef.current.id);
          setConnectionStatus("Connected to server");
          reconnectAttempts.current = 0;
        });

        // Log transport upgrades
        socketRef.current.io.engine.on("upgrade", () => {
          console.log("Transport upgraded to:", socketRef.current.io.engine.transport.name);
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Socket connect error:", error);
          console.error("Error details:", {
            message: error.message,
            description: error.description,
            type: error.type
          });
          setConnectionStatus(`Connection error: ${error.message}`);

          reconnectAttempts.current += 1;
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log("Max reconnection attempts reached");
            socketRef.current.disconnect();
          }
        });

        socketRef.current.on("connect", () => {
          console.log("Socket connected successfully with ID:", socketRef.current.id);
          setConnectionStatus("Connected to server");
          setError(null);
          reconnectAttempts.current = 0;

          // Fetch initial data after successful connection
          fetchCurrentMatch();
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log("Socket disconnected. Reason:", reason);
          setConnectionStatus(`Disconnected from server: ${reason}`);

          if (reason === "io server disconnect") {
            // Server initiated disconnect, try reconnecting
            console.log("Attempting to reconnect after server disconnect...");
            socketRef.current.connect();
          }
        });

        socketRef.current.on("matchUpdate", (data) => {
          console.log("Received match update:", data);
          setMatchData({ players: data.players });
          setLastUpdate(new Date().toISOString());
        });

        socketRef.current.on("error", (error) => {
          console.error("Socket error:", error);
          setError(`Socket error: ${error.message}`);
        });

      } catch (error) {
        console.error("Socket initialization error:", error);
        setError(`Socket initialization failed: ${error.message}`);
        setConnectionStatus(`Failed to initialize socket connection`);
      }
    };

    // Initial connection
    console.log("Component mounted, initiating socket connection...");
    connectSocket();

    // Cleanup function
    return () => {
      console.log("Component unmounting, cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array

  if (!matchData || !matchData.players) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 text-white">
        <div className="p-4 rounded-lg bg-black/50">
          <h2 className="text-xl mb-4">Scrabble Stats Overlay</h2>
          <p>Status: {connectionStatus}</p>
          <p className="text-sm mt-2">Waiting for player selection...</p>
          {lastUpdate && (
            <p className="text-sm mt-2">Last update: {lastUpdate}</p>
          )}
        </div>
      </div>
    );
  }

  const { players } = matchData;
  const [player1, player2] = players;

  return (
    <div className="fixed inset-0 flex items-center justify-between p-8 pointer-events-none">
      {/* Left player stats */}
      <div className="bg-black/50 text-white p-4 rounded-lg w-64">
        <h2 className="text-xl font-bold mb-2">
          {player1?.name || "Player 1"}
        </h2>
        <div className="space-y-1">
          <div>Record: {player1?.wins || 0}-{player1?.losses || 0}-{player1?.ties || 0}</div>
          <div>Average Score: {player1?.averageScore || "N/A"}</div>
          <div>High Score: {player1?.highScore || "N/A"}</div>
          <div>Spread: {player1?.spread || "N/A"}</div>
        </div>
      </div>

      {/* Right player stats */}
      <div className="bg-black/50 text-white p-4 rounded-lg w-64">
        <h2 className="text-xl font-bold mb-2">
          {player2?.name || "Player 2"}
        </h2>
        <div className="space-y-1">
          <div>Record: {player2?.wins || 0}-{player2?.losses || 0}-{player2?.ties || 0}</div>
          <div>Average Score: {player2?.averageScore || "N/A"}</div>
          <div>High Score: {player2?.highScore || "N/A"}</div>
          <div>Spread: {player2?.spread || "N/A"}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;
