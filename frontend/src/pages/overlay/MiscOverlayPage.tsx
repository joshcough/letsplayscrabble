import React, { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import GameHistoryDisplay from "../../components/shared/GameHistoryDisplay";
import PointsDisplay from "../../components/shared/PointsDisplay";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import DisplaySourceManager from "../../hooks/DisplaySourceManager";
import { fetchCurrentMatchWithPlayers } from "../../utils/matchApi";
import { MatchWithPlayers } from "@shared/types/admin";
import {
  formatSpread,
  formatRecord,
  formatUnderCamRecord,
  formatFullUnderCam,
  formatUnderCamNoSeed,
  formatFullUnderCamWithRating,
  formatBestOf7,
} from "../../utils/statsOverlayHelpers";

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
  | "player1-under-cam-no-seed"
  | "player2-under-cam-no-seed"
  | "player1-under-cam-small"
  | "player2-under-cam-small"
  | "player1-under-cam-with-rating"
  | "player2-under-cam-with-rating"
  | "player1-points"
  | "player2-points"
  | "player1-game-history"
  | "player2-game-history"
  | "player1-game-history-small"
  | "player2-game-history-small"
  | "player1-bo7"
  | "player2-bo7"
  | "tournament-data"
  | null;

const MiscOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { userId } = useParams<{ userId: string }>();
  const source = searchParams.get("source") as SourceType;

  const [matchWithPlayers, setMatchWithPlayers] =
    useState<MatchWithPlayers | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    currentMatch,
    loading: matchLoading,
    error: matchError,
  } = useCurrentMatch();

  // Fetch full match data when current match changes
  const fetchFullMatchData = async () => {
    if (!userId) {
      setError("User ID not found in URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔄 MiscOverlay: Fetching full match data for user:", userId);

      const fullMatchData = await fetchCurrentMatchWithPlayers(
        parseInt(userId),
      );
      setMatchWithPlayers(fullMatchData);
    } catch (err) {
      console.error("Error fetching full match data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch match data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentMatch && userId) {
      fetchFullMatchData();
    }
  }, [currentMatch, userId]);

  // Listen for games being added to current tournament and refetch match data via broadcast channel
  useEffect(() => {
    if (!userId) return;

    const displayManager = DisplaySourceManager.getInstance();

    const cleanup = displayManager.onGamesAdded((data: any) => {
      console.log("📥 MiscOverlay received GamesAdded:", data);
      if (
        data.userId === parseInt(userId) &&
        data.tournamentId === currentMatch?.tournament_id
      ) {
        fetchFullMatchData();
      }
    });

    return cleanup;
  }, [currentMatch?.tournament_id, userId]);

  // Early return with error display
  if (matchError || error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{matchError || error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (matchLoading || loading || !matchWithPlayers) {
    return <div className="text-black p-2">Loading...</div>;
  }

  const [player1, player2] = matchWithPlayers.players;

  if (source) {
    const renderElement = () => {
      const player = source.startsWith("player1") ? player1 : player2;
      const side = source.startsWith("player1") ? "player1" : "player2";
      switch (source) {
        case "player1-name":
        case "player2-name":
          return (
            <div className="text-black">{player?.firstLast || "Player"}</div>
          );

        case "player1-record":
        case "player2-record":
          return (
            <div className="text-black">Record: {formatRecord(player)}</div>
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
            <div className="text-black">
              Spread: {formatSpread(player?.spread)}
            </div>
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
          return <div className="text-black">{formatFullUnderCam(player)}</div>;

        case "player1-under-cam-no-seed":
        case "player2-under-cam-no-seed":
          return (
            <div className="text-black">{formatUnderCamNoSeed(player)}</div>
          );

        case "player1-under-cam-small":
        case "player2-under-cam-small":
          return (
            <div className="text-black">{formatUnderCamRecord(player)}</div>
          );

        case "player1-under-cam-with-rating":
        case "player2-under-cam-with-rating":
          return (
            <div className="text-black">
              {formatFullUnderCamWithRating(player)}
            </div>
          );

        case "player1-bo7":
        case "player2-bo7":
          return <div className="text-black">{formatBestOf7(player)}</div>;

        case "player1-points":
        case "player2-points":
        case "player1-game-history":
        case "player2-game-history":
          return (
            <div>
              <div className="text-black">
                <PointsDisplay stats={player} side={side} />
              </div>
              <div className="text-black">
                <GameHistoryDisplay
                  games={
                    matchWithPlayers.last5?.[
                      source.startsWith("player1") ? 0 : 1
                    ] || []
                  }
                  side={side}
                />
              </div>
            </div>
          );
        case "player1-game-history-small":
        case "player2-game-history-small":
          return (
            <GameHistoryDisplay
              games={
                matchWithPlayers.last5?.[
                  source.startsWith("player1") ? 0 : 1
                ] || []
              }
              side={side}
            />
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

  // No source parameter - shouldn't happen in production
  return <div className="text-black p-2">No source parameter provided</div>;
};

export default MiscOverlay;
