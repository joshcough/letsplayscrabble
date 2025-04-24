import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import { API_BASE } from "../../config/api";
import { MatchWithPlayers } from "@shared/types/admin";
import GameHistoryDisplay from "./GameHistoryDisplay";
import HSGameHistoryDisplay from "./HSGameHistoryDisplay";
import ElemGameHistoryDisplay from "./ElemGameHistoryDisplay";
import PointsDisplay from "./PointsDisplay";

type SourceType =
  | "player1-name"
  | "player2-name"
  | "player1-record"
  | "player2-record"
  | "player1-average-score"
  | "player2-average-score"
  | "player1-high-score"
  | "player2-high-score"
  | "player1-spread"
  | "player2-spread"
  | "player1-rank"
  | "player2-rank"
  | "player1-rank-ordinal"
  | "player2-rank-ordinal"
  | "player1-rating"
  | "player2-rating"
  | "player1-under-cam"
  | "player2-under-cam"
  | "player1-under-cam-small"
  | "player2-under-cam-small"
  | "player1-points"
  | "player2-points"
  | "player1-game-history"
  | "player2-game-history"
  | "player1-bo7"
  | "player2-bo7"
  | "tournament-data"
  // elementary school
  | "player1-esms-first-names"
  | "player2-esms-first-names"
  | "player1-esms-team-name"
  | "player2-esms-team-name"
  | "player1-esms-grades"
  | "player2-esms-grades"
  | "player1-esms-hometowns"
  | "player2-esms-hometowns"
  | "player1-elem-game-history"
  | "player2-elem-game-history"
  // high school
  | "player1-hs-name"
  | "player2-hs-name"
  | "player1-hs-grade"
  | "player2-hs-grade"
  | "player1-hs-hometown"
  | "player2-hs-hometown"
  | "player1-hs-school-name"
  | "player2-hs-school-name"
  | "player1-hs-game-history"
  | "player2-hs-game-history"
  | null;

const StatsOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as SourceType;
  const [matchWithPlayers, setMatchWithPlayers] =
    useState<MatchWithPlayers | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Initializing...");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const fetchCurrentMatch = async () => {
      try {
        console.log("Fetching current match...");
        const response = await fetch(`${API_BASE}/api/overlay/match/current`);
        const data = await response.json();
        console.log("Received match data:", data);
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch match data");
        }
        setMatchWithPlayers(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching current match:", err);
        setError(
          `Failed to fetch current match: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    };

    const connectSocket = () => {
      if (socketRef.current?.connected) {
        console.log("Socket already connected, skipping connection...");
        return;
      }

      try {
        console.log("Attempting to connect to:", API_BASE);

        // Clean up existing socket if any
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        socketRef.current = io(API_BASE, {
          transports: ["polling", "websocket"], // Start with polling, upgrade to websocket
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: maxReconnectAttempts,
          timeout: 60000, // Increased timeout
          forceNew: true,
          withCredentials: true,
        });

        socketRef.current.on("connect", () => {
          console.log("Socket connected successfully");
          setConnectionStatus("Connected to server");
          reconnectAttempts.current = 0;
          setError(null);
          fetchCurrentMatch();
        });

        socketRef.current.on("connect_error", (error: Error) => {
          console.log("Connection error:", error.message);
          setConnectionStatus(`Connection error: ${error.message}`);
          // Only set error if we've exceeded max attempts
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            setError(`Socket connection error: ${error.message}`);
          }
        });

        socketRef.current.on("disconnect", (reason: string) => {
          console.log("Socket disconnected. Reason:", reason);
          setConnectionStatus(`Disconnected: ${reason}`);

          // Don't try to reconnect on intentional disconnects
          if (
            reason === "io server disconnect" ||
            reason === "io client disconnect"
          ) {
            return;
          }

          // Attempt reconnection if within limits
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            setTimeout(() => {
              console.log(
                `Attempting reconnect ${reconnectAttempts.current}/${maxReconnectAttempts}`,
              );
              socketRef.current?.connect();
            }, 2000);
          }
        });

        socketRef.current.on("matchUpdate", (data: MatchWithPlayers) => {
          console.log("Received match update");
          setMatchWithPlayers(data);
          setLastUpdate(new Date().toISOString());
        });

        // Initial data fetch
        fetchCurrentMatch();
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
        console.log("Cleaning up socket connection...");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Early return with error display
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

  // Loading state
  if (!matchWithPlayers) {
    if (source) {
      return <div className="text-black p-2">Loading...</div>;
    }
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4">
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

  const [player1, player2] = matchWithPlayers.players;

  if (source) {
    const renderElement = () => {
      const player = source.startsWith("player1") ? player1 : player2;
      switch (source) {
        case "player1-name":
        case "player2-name":
          return (
            <div className="text-black">{player?.firstLast || "Player"}</div>
          );
        case "player1-record":
        case "player2-record":
          return (
            <div className="text-black">
              Record: {player?.wins || 0}-{player?.losses || 0}-
              {player?.ties || 0}
            </div>
          );
        case "player1-average-score":
        case "player2-average-score":
          return (
            <div className="text-black">
              Average Score: {player?.averageScoreRounded || "N/A"}
            </div>
          );
        case "player1-high-score":
        case "player2-high-score":
          return (
            <div className="text-black">
              High Score: {player?.highScore || "N/A"}
            </div>
          );
        case "player1-spread":
        case "player2-spread":
          return (
            <div className="text-black">Spread: {player?.spread || "N/A"}</div>
          );
        case "player1-rank":
        case "player2-rank":
          return (
            <div className="text-black">Rank: {player?.rank || "N/A"}</div>
          );
        case "player1-rank-ordinal":
        case "player2-rank-ordinal":
          return (
            <div className="text-black">{player?.rankOrdinal || "N/A"}</div>
          );
        case "player1-rating":
        case "player2-rating":
          return (
            <div className="text-black">
              Rating: {player?.currentRating || "N/A"}
            </div>
          );
        case "player1-under-cam":
        case "player2-under-cam":
          return (
            <div className="text-black">
              {player?.wins || 0}-{player?.losses || 0}-{player?.ties || 0}{" "}
              {(player?.spread && player.spread > 0 ? "+" : "") +
                (player?.spread || "+0")}
              {" | "}
              {player?.rankOrdinal || "N/A"}
              {" Place"}
              {" ("}
              {player?.seedOrdinal || "N/A"}
              {" Seed)"}
            </div>
          );
        case "player1-under-cam-small":
        case "player2-under-cam-small":
          return (
            <div className="text-black">
              {player?.wins || 0}-{player?.losses || 0}-{player?.ties || 0}{" "}
              {(player?.spread && player.spread > 0 ? "+" : "") +
                (player?.spread || "+0")}
            </div>
          );
        case "player1-bo7":
        case "player2-bo7":
          return (
            <div className="text-black">
              {"Best of 7 Record: "}
              {player?.wins || 0}-{player?.losses || 0}-{player?.ties || 0}{" "}
              {(player?.spread && player.spread > 0 ? "+" : "") +
                (player?.spread || "+0")}
            </div>
          );
        case "player1-esms-first-names":
          return (
            <div className="text-black">{player?.etc.firstname1 || "N/A"} {" & "} {player?.etc.firstname2 || "N/A"}</div>
          );
        case "player2-esms-first-names":
          return (
            <div className="text-black">{player?.etc.firstname1 || "N/A"} {" & "} {player?.etc.firstname2 || "N/A"}</div>
          );
        case "player1-esms-team-name":
          const p1TeamName: string = player?.etc.teamname.join(" ");
          return (
            <div className="text-black">{p1TeamName}</div>
          );
        case "player2-esms-team-name":
          const p2TeamName: string = player?.etc.teamname.join(" ");
          return (
            <div className="text-black">{p2TeamName}</div>
          );
        case "player1-esms-grades":
          return (
            <div className="text-black">{" Grades "} {player?.etc.grade1} {" / "} {player?.etc.grade2}</div>
          );
        case "player2-esms-grades":
          return (
            <div className="text-black">{" Grades "} {player?.etc.grade1} {" / "} {player?.etc.grade2}</div>
          );
        case "player1-esms-hometowns":
          const p1Hometown1 = player?.etc.hometown1.join(" ") + ", " + player?.etc.state1.join(" ");
          const p1Hometown2 = player?.etc.hometown2.join(" ") + ", " + player?.etc.state2.join(" ");
          const p1Hometown = p1Hometown1 === p1Hometown2 ? p1Hometown1 : p1Hometown1 + " & " + p1Hometown2;
          return (
            <div className="text-black">{p1Hometown}</div>
          );
        case "player2-esms-hometowns":
          const p2Hometown1 = player?.etc.hometown1.join(" ") + ", " + player?.etc.state1.join(" ");
          const p2Hometown2 = player?.etc.hometown2.join(" ") + ", " + player?.etc.state2.join(" ");
          const p2Hometown = p2Hometown1 === p2Hometown2 ? p2Hometown1 : p2Hometown1 + " & " + p2Hometown2;
          return (
            <div className="text-black">{p2Hometown}</div>
          );

        case "player1-hs-name":
          return (
            <div className="text-black">{player?.etc.firstname1} {" "} {player?.etc.lastname1}</div>
          );
        case "player2-hs-name":
          return (
            <div className="text-black">{player?.etc.firstname1} {" "} {player?.etc.lastname1}</div>
          );

        case "player1-hs-grade":
          return (
            <div className="text-black">{" Grade "} {player?.etc.grade1}</div>
          );
        case "player2-hs-grade":
          return (
            <div className="text-black">{" Grade "} {player?.etc.grade1}</div>
          );
        case "player1-hs-hometown":
          return (
            <div className="text-black">{player?.etc.hometown1.join(" ") + ", " + player?.etc.state1.join(" ")}</div>
          );
        case "player2-hs-hometown":
          return (
            <div className="text-black">{player?.etc.hometown1.join(" ") + ", " + player?.etc.state1.join(" ")}</div>
          );
        case "player1-hs-school-name":
          return (
            <div className="text-black">{player?.etc.schoolname1.join(" ")}</div>
          );
        case "player2-hs-school-name":
          return (
            <div className="text-black">{player?.etc.schoolname1.join(" ")}</div>
          );
        case "player1-points":
        case "player2-points":
        case "player1-game-history":
        case "player2-game-history":
          const playerIndex = source === "player1-game-history" ? 0 : 1;
          const games = matchWithPlayers.last5?.[playerIndex] || [];
          return (
            <div>
              <div className="text-black">
                <PointsDisplay
                  stats={player}
                  side={source.startsWith("player1") ? "player1" : "player2"}
                />
              </div>
              <div className="text-black">
                <GameHistoryDisplay
                  games={games}
                  side={source.startsWith("player1") ? "player1" : "player2"}
                />
              </div>
            </div>
          );
        case "player1-hs-game-history":
        case "player2-hs-game-history":
          const playerHsIndex = source === "player1-hs-game-history" ? 0 : 1;
          const hsGames = matchWithPlayers.last5?.[playerHsIndex] || [];
          return (
            <div>
              <div className="text-black">
                <PointsDisplay
                  stats={player}
                  side={source.startsWith("player1") ? "player1" : "player2"}
                />
              </div>
              <div className="text-black">
                <HSGameHistoryDisplay
                  games={hsGames}
                  side={source.startsWith("player1") ? "player1" : "player2"}
                />
              </div>
            </div>
          );
        case "player1-elem-game-history":
        case "player2-elem-game-history":
          const playerElemIndex = source === "player1-elem-game-history" ? 0 : 1;
          const elemGames = matchWithPlayers.last5?.[playerElemIndex] || [];
          return (
            <div>
              <div className="text-black">
                <PointsDisplay
                  stats={player}
                  side={source.startsWith("player1") ? "player1" : "player2"}
                />
              </div>
              <div className="text-black">
                <ElemGameHistoryDisplay
                  games={elemGames}
                  side={source.startsWith("player1") ? "player1" : "player2"}
                />
              </div>
            </div>
          );

        case "tournament-data":
          return (
            <div className="text-black">
              {matchWithPlayers.tournament.name || "N/A"}
              {" | "}
              {matchWithPlayers.tournament.lexicon || "N/A"}
              {" | Round "}
              {matchWithPlayers.matchData.round || "N/A"}
            </div>
          );
        default:
          return null;
      }
    };

    return <div className="inline-block text-black">{renderElement()}</div>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-between p-8 pointer-events-none">
      <div className="text-black p-4 w-64" data-obs="player1-container">
        <div data-obs="player1-name">
          <h2 className="text-xl font-bold mb-2">
            {player1?.firstLast || "Player 1"}
          </h2>
        </div>
        <div className="space-y-1">
          <div data-obs="player1-record">
            Record: {player1?.wins || 0}-{player1?.losses || 0}-
            {player1?.ties || 0}
          </div>
          <div data-obs="player1-average-score">
            Average Score: {player1?.averageScoreRounded || "N/A"}
          </div>
          <div data-obs="player1-high-score">
            High Score: {player1?.highScore || "N/A"}
          </div>
          <div data-obs="player1-spread">Spread: {player1?.spread || "+0"}</div>
          <div data-obs="player1-rank">Rank: {player1?.rank || "N/A"}</div>
          <div data-obs="player1-rank-ordinal">
            Rank Ordinal: {player1?.rankOrdinal || "N/A"}
          </div>
          <div data-obs="player1-rating">
            Rating: {player1?.currentRating || "N/A"}
          </div>
          <div data-obs="player1-under-cam">
            Rating: {player1?.currentRating || "N/A"} {" | "}
            {player1?.wins || 0}-{player1?.losses || 0}-{player1?.ties || 0}{" "}
            {(player1?.spread && player1.spread > 0 ? "+" : "") +
              (player1?.spread || "+0")}
            {" | "}
            {player1?.rankOrdinal || "N/A"}
          </div>
          {matchWithPlayers.last5 && (
            <GameHistoryDisplay
              games={matchWithPlayers.last5[0]}
              side="player1"
            />
          )}
        </div>
      </div>

      <div className="text-black p-4 w-64" data-obs="player2-container">
        <h2 className="text-xl font-bold mb-2" data-obs="player2-name">
          {player2?.firstLast || "Player 2"}
        </h2>
        <div className="space-y-1">
          <div data-obs="player2-record">
            Record: {player2?.wins || 0}-{player2?.losses || 0}-
            {player2?.ties || 0}
          </div>
          <div data-obs="player2-average-score">
            Average Score: {player2?.averageScoreRounded || "N/A"}
          </div>
          <div data-obs="player2-high-score">
            High Score: {player2?.highScore || "N/A"}
          </div>
          <div data-obs="player2-spread">Spread: {player2?.spread || "+0"}</div>
          <div data-obs="player2-rank">Rank: {player2?.rank || "N/A"}</div>
          <div data-obs="player2-rank-ordinal">
            Rank Ordinal: {player2?.rankOrdinal || "N/A"}
          </div>
          <div data-obs="player2-rating">
            Rating: {player2?.currentRating || "N/A"}
          </div>
          <div data-obs="player2-under-cam">
            Rating: {player2?.currentRating || "N/A"} {" | "}
            {player2?.wins || 0}-{player2?.losses || 0}-{player2?.ties || 0}{" "}
            {player2?.spread || "+0"}
            {" | "}
            {player2?.rankOrdinal || "N/A"}
          </div>
          {matchWithPlayers.last5 && (
            <>
              {console.log("Rendering GameHistory:", matchWithPlayers.last5[1])}
              <GameHistoryDisplay
                games={matchWithPlayers.last5[1]}
                side="player2"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;
