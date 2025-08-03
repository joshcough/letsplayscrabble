import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { useTournamentData } from "../../hooks/useTournamentData";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { TournamentDataIncremental } from "@shared/types/broadcast";
import BroadcastManager from "../../hooks/BroadcastManager";
import * as DB from "@shared/types/database";

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
  const { userId, tournamentId: urlTournamentId, divisionName } = useParams<RouteParams>();

  // State for animation
  const [highScoreEvent, setHighScoreEvent] = useState<HighScoreEvent | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine data source (URL params vs current match)
  const shouldUseCurrentMatch = !urlTournamentId || !divisionName;

  // Get current match data if needed
  const {
    currentMatch,
    loading: currentMatchLoading
  } = useCurrentMatch();

  // Get tournament data via URL params
  const {
    tournamentData: urlTournamentData,
    selectedDivisionId: urlDivisionId,
    loading: urlLoading
  } = useTournamentData({
    tournamentId: urlTournamentId ? parseInt(urlTournamentId) : undefined,
    useUrlParams: !shouldUseCurrentMatch
  });

  // Get tournament data for current match if needed
  const {
    tournamentData: currentMatchTournamentData,
    loading: currentMatchTournamentLoading
  } = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    useUrlParams: false
  });

  // Determine effective data
  const effectiveTournamentData = shouldUseCurrentMatch ? currentMatchTournamentData : urlTournamentData;
  const effectiveDivisionId = shouldUseCurrentMatch ? currentMatch?.division_id : urlDivisionId;
  const effectiveLoading = shouldUseCurrentMatch ? (currentMatchLoading || currentMatchTournamentLoading) : urlLoading;

  // Get division data
  const divisionData = effectiveTournamentData?.divisions.find(
    (d: any) => d.division.id === effectiveDivisionId
  );

  // Helper function to get high score for a division
  const getHighScoreForDivision = (tournament: DB.Tournament, divisionId: number) => {
    const division = tournament.divisions.find(d => d.division.id === divisionId);
    if (!division) return { score: 0, playerName: '', gameId: 0 };

    let highScore = 0;
    let highScorePlayerName = '';
    let highScoreGameId = 0;

    for (const game of division.games) {
      if (game.player1_score && game.player1_score > highScore) {
        highScore = game.player1_score;
        const player = division.players.find(p => p.id === game.player1_id);
        highScorePlayerName = player?.name || 'Unknown';
        highScoreGameId = game.id;
      }
      if (game.player2_score && game.player2_score > highScore) {
        highScore = game.player2_score;
        const player = division.players.find(p => p.id === game.player2_id);
        highScorePlayerName = player?.name || 'Unknown';
        highScoreGameId = game.id;
      }
    }

    return { score: highScore, playerName: highScorePlayerName, gameId: highScoreGameId };
  };

  // Helper function to get highest score from changes only
  const getHighScoreFromChanges = (changes: DB.GameChanges, divisionId: number, players: DB.PlayerRow[]) => {
    let highScore = 0;
    let highScorePlayerName = '';

    // Check added games
    for (const game of changes.added.filter(g => g.division_id === divisionId)) {
      if (game.player1_score && game.player1_score > highScore) {
        highScore = game.player1_score;
        const player = players.find(p => p.id === game.player1_id);
        highScorePlayerName = player?.name || 'Unknown';
      }
      if (game.player2_score && game.player2_score > highScore) {
        highScore = game.player2_score;
        const player = players.find(p => p.id === game.player2_id);
        highScorePlayerName = player?.name || 'Unknown';
      }
    }

    // Check updated games
    for (const game of changes.updated.filter(g => g.division_id === divisionId)) {
      if (game.player1_score && game.player1_score > highScore) {
        highScore = game.player1_score;
        const player = players.find(p => p.id === game.player1_id);
        highScorePlayerName = player?.name || 'Unknown';
      }
      if (game.player2_score && game.player2_score > highScore) {
        highScore = game.player2_score;
        const player = players.find(p => p.id === game.player2_id);
        highScorePlayerName = player?.name || 'Unknown';
      }
    }

    return { score: highScore, playerName: highScorePlayerName };
  };

  // Listen for incremental updates
  useEffect(() => {
    if (!userId || !effectiveDivisionId || !divisionData) {
      console.log('🎯 HighScoreAnimation: Not ready to listen for updates:', {
        userId: !!userId,
        effectiveDivisionId,
        divisionDataReady: !!divisionData
      });
      return;
    }

    console.log('🎯 HighScoreAnimation: Setting up listener for division', effectiveDivisionId, 'in tournament', effectiveTournamentData?.tournament.id);

    const cleanup = BroadcastManager.getInstance().onTournamentDataIncremental(
      (data: TournamentDataIncremental) => {
        console.log('🎯 HighScoreAnimation: Received TOURNAMENT_DATA_INCREMENTAL:', {
          dataUserId: data.userId,
          ourUserId: parseInt(userId),
          dataTournamentId: data.tournamentId,
          ourTournamentId: effectiveTournamentData?.tournament.id,
          affectedDivisions: data.affectedDivisions,
          ourDivisionId: effectiveDivisionId,
          addedGames: data.changes.added.length,
          updatedGames: data.changes.updated.length
        });

        // Filter for our user and tournament
        if (data.userId !== parseInt(userId)) {
          console.log('🎯 HighScoreAnimation: Ignoring - different user');
          return;
        }

        // Check if this update affects our division
        if (!data.affectedDivisions.includes(effectiveDivisionId)) {
          console.log('🎯 HighScoreAnimation: Ignoring - division not affected');
          return;
        }

        // Only process if we have both old and new data
        if (!data.previousData || !data.data) {
          console.log('🎯 HighScoreAnimation: Missing previous or new data');
          return;
        }

        console.log('🎯 HighScoreAnimation: Processing update - checking for new high scores in changes...');

        // Get the highest score from just the changes for our division
        const changesHighScore = getHighScoreFromChanges(data.changes, effectiveDivisionId, divisionData.players);

        // Get the previous high score for the division
        const previousHighScore = getHighScoreForDivision(data.previousData, effectiveDivisionId);

        console.log('🎯 HighScoreAnimation: Score comparison:', {
          changesHighScore: changesHighScore.score,
          changesPlayer: changesHighScore.playerName,
          previousHighScore: previousHighScore.score,
          previousPlayer: previousHighScore.playerName,
          isNewRecord: changesHighScore.score > previousHighScore.score
        });

        // Check if the highest score in the changes beats the previous record
        if (changesHighScore.score > previousHighScore.score && changesHighScore.score > 0) {
          console.log(`🏆 NEW HIGH SCORE! ${changesHighScore.playerName}: ${changesHighScore.score} (was ${previousHighScore.score})`);

          // Trigger animation with slight delay to allow DOM update
          const newEvent = {
            score: changesHighScore.score,
            playerName: changesHighScore.playerName,
            previousHighScore: previousHighScore.score,
            timestamp: Date.now()
          };

          console.log('🎬 Setting high score event:', newEvent);
          setHighScoreEvent(newEvent);

          // Small delay to ensure DOM is updated before starting animation
          setTimeout(() => {
            setIsAnimating(true);
          }, 50);
        } else {
          console.log(`📊 No new high score in changes. Changes high: ${changesHighScore.score}, Previous record: ${previousHighScore.score}`);
        }
      }
    );

    return cleanup;
  }, [userId, effectiveDivisionId, divisionData, effectiveTournamentData]);

  // Handle animation timing with proper state management
  useEffect(() => {
    if (highScoreEvent && isAnimating) {
      console.log('🎬 Starting animation timer for event:', highScoreEvent);

      const hideTimeout = setTimeout(() => {
        console.log('🎬 Animation timer expired - hiding popup');
        setIsAnimating(false);
        setTimeout(() => {
          console.log('🎬 Fade out complete - clearing event');
          setHighScoreEvent(null);
        }, 700); // Match the transition duration
      }, 5000);

      return () => {
        console.log('🎬 Cleaning up animation timer');
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
  console.log('🎬 Rendering popup with event:', highScoreEvent, 'isAnimating:', isAnimating);

  return (
    <div className="w-full h-full bg-transparent relative">
      {/* Always render the container so we can animate it */}
      <div
        className={`
          fixed inset-0 flex items-center justify-center z-50
          transition-all duration-700 ease-out
          ${!highScoreEvent
            ? 'opacity-0 -translate-x-full pointer-events-none' // Hidden: off-screen left
            : isAnimating
              ? 'opacity-100 translate-x-0'                     // Visible: center
              : 'opacity-0 translate-x-full pointer-events-none' // Exiting: off-screen right
          }
        `}
      >
        {/* Only render content when there's an event */}
        {highScoreEvent && (
          <>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50" />

            {/* Popup Container - Clean and simple */}
            <div className="relative bg-white text-gray-900 p-4 sm:p-6 lg:p-12 rounded-lg shadow-2xl border-2 border-gray-300 w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto">
              <div className="text-center space-y-2 sm:space-y-4 lg:space-y-6">

                {/* Title */}
                <div className="text-lg sm:text-2xl lg:text-4xl font-black text-gray-800">
                  NEW HIGH SCORE!
                </div>

                {/* Score - The star of the show */}
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-3 sm:p-6 lg:p-8 shadow-inner">
                  <div className="text-3xl sm:text-5xl lg:text-8xl font-black">
                    {highScoreEvent.score}
                  </div>
                </div>

                {/* Player Name */}
                <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800">
                  {highScoreEvent.playerName}
                </div>

                {/* Previous Record */}
                <div className="text-sm sm:text-lg lg:text-2xl text-gray-600 font-semibold">
                  Previous: {highScoreEvent.previousHighScore}
                </div>

                {/* Division Name */}
                <div className="text-xs sm:text-base lg:text-xl text-gray-500 font-medium">
                  Division {divisionData.division.name}
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HighScoreAnimationOverlay;