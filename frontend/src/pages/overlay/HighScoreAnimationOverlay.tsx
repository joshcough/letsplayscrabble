import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { TournamentDataIncremental } from "@shared/types/broadcast";
import * as DB from "@shared/types/database";

import BroadcastManager from "../../hooks/BroadcastManager";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";

type RouteParams = {
  userId: string;
  tournamentId?: string;
  divisionName?: string;
};

interface HighScoreEvent {
  score: number;
  playerName: string;
  previousHighScore: number;
  timestamp: number;
}

const HighScoreAnimationOverlay: React.FC = () => {
  const {
    userId,
    tournamentId: urlTournamentId,
    divisionName,
  } = useParams<RouteParams>();

  // State for animation
  const [highScoreEvent, setHighScoreEvent] = useState<HighScoreEvent | null>(
    null,
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine data source (URL params vs current match)
  const shouldUseCurrentMatch = !urlTournamentId || !divisionName;

  // Get current match data if needed
  const { currentMatch, loading: currentMatchLoading } = useCurrentMatch();

  // Get tournament data via URL params
  const {
    tournamentData: urlTournamentData,
    selectedDivisionId: urlDivisionId,
    loading: urlLoading,
  } = useTournamentData({
    tournamentId: urlTournamentId ? parseInt(urlTournamentId) : undefined,
    useUrlParams: !shouldUseCurrentMatch,
  });

  // Get tournament data for current match if needed
  const {
    tournamentData: currentMatchTournamentData,
    loading: currentMatchTournamentLoading,
  } = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    useUrlParams: false,
  });

  // Determine effective data
  const effectiveTournamentData = shouldUseCurrentMatch
    ? currentMatchTournamentData
    : urlTournamentData;
  const effectiveDivisionId = shouldUseCurrentMatch
    ? currentMatch?.division_id
    : urlDivisionId;
  const effectiveLoading = shouldUseCurrentMatch
    ? currentMatchLoading || currentMatchTournamentLoading
    : urlLoading;

  // Get division data
  const divisionData = effectiveTournamentData?.divisions.find(
    (d: any) => d.division.id === effectiveDivisionId,
  );

  // Helper function to get high score for a division
  const getHighScoreForDivision = (
    tournament: DB.Tournament,
    divisionId: number,
  ) => {
    const division = tournament.divisions.find(
      (d) => d.division.id === divisionId,
    );
    if (!division) return { score: 0, playerName: "", gameId: 0 };

    let highScore = 0;
    let highScorePlayerName = "";
    let highScoreGameId = 0;

    for (const game of division.games) {
      if (game.player1_score && game.player1_score > highScore) {
        highScore = game.player1_score;
        const player = division.players.find((p) => p.id === game.player1_id);
        highScorePlayerName = player?.name || "Unknown";
        highScoreGameId = game.id;
      }
      if (game.player2_score && game.player2_score > highScore) {
        highScore = game.player2_score;
        const player = division.players.find((p) => p.id === game.player2_id);
        highScorePlayerName = player?.name || "Unknown";
        highScoreGameId = game.id;
      }
    }

    return {
      score: highScore,
      playerName: highScorePlayerName,
      gameId: highScoreGameId,
    };
  };

  // Helper function to get highest score from changes only
  const getHighScoreFromChanges = (
    changes: DB.GameChanges,
    divisionId: number,
    players: DB.PlayerRow[],
  ) => {
    let highScore = 0;
    let highScorePlayerName = "";

    // Check added games
    for (const game of changes.added.filter(
      (g) => g.division_id === divisionId,
    )) {
      if (game.player1_score && game.player1_score > highScore) {
        highScore = game.player1_score;
        const player = players.find((p) => p.id === game.player1_id);
        highScorePlayerName = player?.name || "Unknown";
      }
      if (game.player2_score && game.player2_score > highScore) {
        highScore = game.player2_score;
        const player = players.find((p) => p.id === game.player2_id);
        highScorePlayerName = player?.name || "Unknown";
      }
    }

    // Check updated games
    for (const game of changes.updated.filter(
      (g) => g.division_id === divisionId,
    )) {
      if (game.player1_score && game.player1_score > highScore) {
        highScore = game.player1_score;
        const player = players.find((p) => p.id === game.player1_id);
        highScorePlayerName = player?.name || "Unknown";
      }
      if (game.player2_score && game.player2_score > highScore) {
        highScore = game.player2_score;
        const player = players.find((p) => p.id === game.player2_id);
        highScorePlayerName = player?.name || "Unknown";
      }
    }

    return { score: highScore, playerName: highScorePlayerName };
  };

  // Listen for incremental updates
  useEffect(() => {
    if (!userId || !effectiveDivisionId || !divisionData) {
      console.log("🎯 HighScoreAnimation: Not ready to listen for updates:", {
        userId: !!userId,
        effectiveDivisionId,
        divisionDataReady: !!divisionData,
      });
      return;
    }

    console.log(
      "🎯 HighScoreAnimation: Setting up listener for division",
      effectiveDivisionId,
      "in tournament",
      effectiveTournamentData?.tournament.id,
    );

    const cleanup = BroadcastManager.getInstance().onTournamentDataIncremental(
      (data: TournamentDataIncremental) => {
        console.log(
          "🎯 HighScoreAnimation: Received TOURNAMENT_DATA_INCREMENTAL:",
          {
            dataUserId: data.userId,
            ourUserId: parseInt(userId),
            dataTournamentId: data.tournamentId,
            ourTournamentId: effectiveTournamentData?.tournament.id,
            affectedDivisions: data.affectedDivisions,
            ourDivisionId: effectiveDivisionId,
            addedGames: data.changes.added.length,
            updatedGames: data.changes.updated.length,
          },
        );

        // Filter for our user and tournament
        if (data.userId !== parseInt(userId)) {
          console.log("🎯 HighScoreAnimation: Ignoring - different user");
          return;
        }

        // Check if this update affects our division
        if (!data.affectedDivisions.includes(effectiveDivisionId)) {
          console.log(
            "🎯 HighScoreAnimation: Ignoring - division not affected",
          );
          return;
        }

        // Only process if we have both old and new data
        if (!data.previousData || !data.data) {
          console.log("🎯 HighScoreAnimation: Missing previous or new data");
          return;
        }

        console.log(
          "🎯 HighScoreAnimation: Processing update - checking for new high scores in changes...",
        );

        // Get the highest score from just the changes for our division
        const changesHighScore = getHighScoreFromChanges(
          data.changes,
          effectiveDivisionId,
          divisionData.players,
        );

        // Get the previous high score for the division
        const previousHighScore = getHighScoreForDivision(
          data.previousData,
          effectiveDivisionId,
        );

        console.log("🎯 HighScoreAnimation: Score comparison:", {
          changesHighScore: changesHighScore.score,
          changesPlayer: changesHighScore.playerName,
          previousHighScore: previousHighScore.score,
          previousPlayer: previousHighScore.playerName,
          isNewRecord: changesHighScore.score > previousHighScore.score,
        });

        // Check if the highest score in the changes beats the previous record
        if (
          changesHighScore.score > previousHighScore.score &&
          changesHighScore.score > 0
        ) {
          console.log(
            `🏆 NEW HIGH SCORE! ${changesHighScore.playerName}: ${changesHighScore.score} (was ${previousHighScore.score})`,
          );

          // Trigger animation
          const newEvent = {
            score: changesHighScore.score,
            playerName: changesHighScore.playerName,
            previousHighScore: previousHighScore.score,
            timestamp: Date.now(),
          };

          console.log("🎬 Setting high score event:", newEvent);
          setHighScoreEvent(newEvent);
          setIsAnimating(true);
        } else {
          console.log(
            `📊 No new high score in changes. Changes high: ${changesHighScore.score}, Previous record: ${previousHighScore.score}`,
          );
        }
      },
    );

    return cleanup;
  }, [userId, effectiveDivisionId, divisionData, effectiveTournamentData]);

  // Handle animation timing
  useEffect(() => {
    if (highScoreEvent && isAnimating) {
      console.log("🎬 Starting animation timer for event:", highScoreEvent);

      const hideTimeout = setTimeout(() => {
        console.log("🎬 Animation timer expired - hiding popup");
        setIsAnimating(false);
        setTimeout(() => {
          console.log("🎬 Fade out complete - clearing event");
          setHighScoreEvent(null);
        }, 500);
      }, 5000);

      return () => {
        console.log("🎬 Cleaning up animation timer");
        clearTimeout(hideTimeout);
      };
    }
  }, [highScoreEvent, isAnimating]);

  // Don't render anything if loading or no data
  if (effectiveLoading || !effectiveTournamentData || !divisionData) {
    return <div className="w-full h-full bg-transparent" />;
  }

  // Don't render anything if no animation event
  if (!highScoreEvent) {
    return <div className="w-full h-full bg-transparent" />;
  }

  // Debug logging for render
  console.log(
    "🎬 Rendering popup with event:",
    highScoreEvent,
    "isAnimating:",
    isAnimating,
  );

  return (
    <div className="w-full h-full bg-transparent relative">
      {/* High Score Animation */}
      <div
        className={`
          fixed inset-0 flex items-center justify-center z-50
          transition-all duration-500 ease-in-out
          ${
            isAnimating
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }
        `}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-50" />

        {/* Popup Container */}
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-800 p-12 rounded-3xl shadow-2xl border-8 border-blue-300 max-w-2xl mx-auto transform">
          <div className="text-center text-white space-y-6">
            {/* Animated Trophy Icon */}
            <div className="text-8xl animate-bounce mb-4">🏆</div>

            {/* Title */}
            <div className="text-5xl font-black text-blue-100 drop-shadow-lg animate-pulse">
              NEW HIGH SCORE!
            </div>

            {/* Score - The star of the show */}
            <div className="bg-white text-gray-900 rounded-2xl p-8 border-4 border-blue-400 shadow-inner">
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
                {highScoreEvent.score}
              </div>
            </div>

            {/* Player Name */}
            <div className="text-4xl font-bold text-blue-100 drop-shadow-md">
              {highScoreEvent.playerName}
            </div>

            {/* Previous Record */}
            <div className="text-2xl text-blue-200 opacity-90 font-semibold">
              Previous Record: {highScoreEvent.previousHighScore}
            </div>

            {/* Division Name */}
            <div className="text-xl text-blue-300 opacity-80 font-medium">
              Division {divisionData.division.name}
            </div>

            {/* Celebration Elements */}
            <div className="absolute -top-4 -left-4 text-6xl animate-spin">
              ⭐
            </div>
            <div
              className="absolute -top-4 -right-4 text-6xl animate-spin"
              style={{ animationDirection: "reverse" }}
            >
              ⭐
            </div>
            <div className="absolute -bottom-4 -left-4 text-6xl animate-bounce">
              🎉
            </div>
            <div
              className="absolute -bottom-4 -right-4 text-6xl animate-bounce"
              style={{ animationDelay: "0.5s" }}
            >
              🎉
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighScoreAnimationOverlay;
