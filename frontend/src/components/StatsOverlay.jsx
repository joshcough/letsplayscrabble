import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from 'react-router-dom';
import io from "socket.io-client";
import { API_BASE } from "../config/api";

const StatsOverlay = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source');
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
        if (!response.ok) throw new Error(data.error || "Failed to fetch match data");
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
      console.log("Debug info:", { API_BASE, currentEnvironment: process.env.NODE_ENV, existingSocket: socketRef.current ? "exists" : "none" });
      if (socketRef.current) {
        console.log("Cleaning up existing socket connection");
        socketRef.current.disconnect();
      }
      try {
        console.log("Attempting to connect to:", API_BASE);
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
          console.log("Connected with transport:", socketRef.current.io.engine.transport.name);
          console.log("Socket connected with ID:", socketRef.current.id);
          setConnectionStatus("Connected to server");
          reconnectAttempts.current = 0;
        });

        socketRef.current.io.engine.on("upgrade", () => {
          console.log("Transport upgraded to:", socketRef.current.io.engine.transport.name);
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Socket connect error:", error);
          console.error("Error details:", { message: error.message, description: error.description, type: error.type });
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
          fetchCurrentMatch();
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log("Socket disconnected. Reason:", reason);
          setConnectionStatus(`Disconnected from server: ${reason}`);
          if (reason === "io server disconnect") {
            console.log("Attempting to reconnect after server disconnect...");
            socketRef.current.connect();
          }
        });

        socketRef.current.onAny((eventName, ...args) => {
          console.log("Received event:", eventName, "with data:", args);
        });

        socketRef.current.on("matchUpdate", (data) => {
          console.log("Received match update:", data);
          setMatchData(data);
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

    console.log("Component mounted, initiating socket connection...");
    connectSocket();

    return () => {
      console.log("Component unmounting, cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  if (!matchData) {
    if (source) {
      return <div className="bg-black/50 text-white p-2 rounded">Loading...</div>;
    }
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 text-white">
        <div className="p-4 rounded-lg bg-black/50">
          <h2 className="text-xl mb-4">Scrabble Stats Overlay</h2>
          <p>Status: {connectionStatus}</p>
          <p className="text-sm mt-2">Waiting for player selection...</p>
          {lastUpdate && <p className="text-sm mt-2">Last update: {lastUpdate}</p>}
        </div>
      </div>
    );
  }

  const [player1, player2] = matchData.players;

  if (source) {
    const renderElement = () => {
      const player = source.startsWith('player1') ? player1 : player2;
      switch (source) {
        case 'player1-name':
        case 'player2-name':
          return <div>{player?.firstLast || "Player"}</div>;
        case 'player1-record':
        case 'player2-record':
          return <div>Record: {player?.wins || 0}-{player?.losses || 0}-{player?.ties || 0}</div>;
        case 'player1-average-score':
        case 'player2-average-score':
          return <div>Average Score: {player?.averageScore || "N/A"}</div>;
        case 'player1-high-score':
        case 'player2-high-score':
          return <div>High Score: {player?.highScore || "N/A"}</div>;
        case 'player1-spread':
        case 'player2-spread':
          return <div>Spread: {player?.spread || "N/A"}</div>;
        case 'player1-rank':
        case 'player2-rank':
          return <div>Rank: {player?.rank || "N/A"}</div>;
        case 'player1-rank-ordinal':
        case 'player2-rank-ordinal':
          return <div>{player?.rankOrdinal || "N/A"}</div>;
        case 'player1-rating':
        case 'player2-rating':
          return <div>Rating: {player?.rating || "N/A"}</div>;
        default:
          return null;
      }
    };

    return (
      <div className="bg-black/50 text-white p-2 rounded inline-block">
        {renderElement()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-between p-8 pointer-events-none">
      <div className="bg-black/50 text-white p-4 rounded-lg w-64" data-obs="player1-container">
        <div data-obs="player1-name">
          <h2 className="text-xl font-bold mb-2" data-obs="player1-name">
            {player1?.firstLast || "Player 1"}
          </h2>
        </div>
        <div className="space-y-1">
          <div data-obs="player1-record">
            Record: {player1?.wins || 0}-{player1?.losses || 0}-{player1?.ties || 0}
          </div>
          <div data-obs="player1-average-score">Average Score: {player1?.averageScore || "N/A"}</div>
          <div data-obs="player1-high-score">High Score: {player1?.highScore || "N/A"}</div>
          <div data-obs="player1-spread">Spread: {player1?.spread || "N/A"}</div>
          <div data-obs="player1-rank">Rank: {player1?.rank || "N/A"}</div>
          <div data-obs="player1-rank-ordinal">Rank Ordinal: {player1?.rankOrdinal || "N/A"}</div>
          <div data-obs="player1-rating">Rating: {player1?.rating || "N/A"}</div>
        </div>
      </div>

      <div className="bg-black/50 text-white p-4 rounded-lg w-64" data-obs="player2-container">
        <h2 className="text-xl font-bold mb-2" data-obs="player2-name">
          {player2?.firstLast || "Player 1"}
        </h2>
        <div className="space-y-1">
          <div data-obs="player2-record">
            Record: {player2?.wins || 0}-{player2?.losses || 0}-{player2?.ties || 0}
          </div>
          <div data-obs="player2-average-score">Average Score: {player2?.averageScore || "N/A"}</div>
          <div data-obs="player2-high-score">High Score: {player2?.highScore || "N/A"}</div>
          <div data-obs="player2-spread">Spread: {player2?.spread || "N/A"}</div>
          <div data-obs="player2-rank">Rank: {player2?.rank || "N/A"}</div>
          <div data-obs="player2-rank-ordinal">Rank Ordinal: {player2?.rankOrdinal || "N/A"}</div>
          <div data-obs="player2-rating">Rating: {player2?.rating || "N/A"}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;