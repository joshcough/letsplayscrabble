import React, { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';

const StatsOverlay = () => {
  const [matchData, setMatchData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [lastUpdate, setLastUpdate] = useState(null);

  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connectSocket = () => {
      console.log("Initializing socket connection...");

      // Clean up existing socket if it exists
      if (socketRef.current) {
        socketRef.current.close();
      }

      socketRef.current = io("http://localhost:3001", {
        transports: ["websocket", "polling"],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        timeout: 10000, // Connection timeout
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected with ID:", socketRef.current.id);
        setConnectionStatus("Connected to server");
        reconnectAttempts.current = 0;
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket disconnected. Reason:", reason);
        setConnectionStatus(`Disconnected from server: ${reason}`);

        // Handle specific disconnect reasons
        if (reason === "io server disconnect") {
          // Server initiated disconnect, try reconnecting
          socketRef.current.connect();
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.log("Socket connection error:", error.message);
        setConnectionStatus(`Connection error: ${error.message}`);

        reconnectAttempts.current += 1;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log("Max reconnection attempts reached");
          socketRef.current.close();
        }
      });

      socketRef.current.on("matchUpdate", (data) => {
        console.log("Received match update:", data);
        setMatchData({ players: data.players });
        setLastUpdate(new Date().toISOString());
      });
    };

    // Initial connection
    connectSocket();

    // Cleanup function
    return () => {
      console.log("Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

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
