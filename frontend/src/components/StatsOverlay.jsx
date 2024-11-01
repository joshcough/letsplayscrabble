import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const StatsOverlay = () => {
  const [matchData, setMatchData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    console.log("Initializing socket connection...");
    const socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionStatus("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnectionStatus("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error);
      setConnectionStatus(`Connection error: ${error.message}`);
    });

    socket.on("matchUpdate", (data) => {
      console.log("Received match update:", data);
      // Use player1_id and player2_id to enforce player ordering
      const [firstPlayer, secondPlayer] = data.players;
      const orderedPlayers =
        firstPlayer.id === data.player1_id
          ? [firstPlayer, secondPlayer]
          : [secondPlayer, firstPlayer];

      setMatchData({ players: orderedPlayers });
      setLastUpdate(new Date().toISOString());
    });

    return () => {
      console.log("Cleaning up socket connection");
      socket.close();
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
          <div>Rating: {player1?.stats?.rating || "N/A"}</div>
          <div>Wins: {player1?.stats?.wins || 0}</div>
          <div>Average Score: {player1?.stats?.avgScore || "N/A"}</div>
        </div>
      </div>

      {/* Right player stats */}
      <div className="bg-black/50 text-white p-4 rounded-lg w-64">
        <h2 className="text-xl font-bold mb-2">
          {player2?.name || "Player 2"}
        </h2>
        <div className="space-y-1">
          <div>Rating: {player2?.stats?.rating || "N/A"}</div>
          <div>Wins: {player2?.stats?.wins || 0}</div>
          <div>Average Score: {player2?.stats?.avgScore || "N/A"}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;
