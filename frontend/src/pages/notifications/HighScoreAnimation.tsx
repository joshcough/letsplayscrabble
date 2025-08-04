import React from "react";

import { TournamentDataIncremental } from "@shared/types/broadcast";
import * as DB from "@shared/types/database";

import TournamentNotificationOverlay, {
  NotificationEvent,
  NotificationDetector,
  NotificationRenderer,
} from "../../components/notifications/TournamentNotificationOverlay";
import {
  getHighScoreForDivision,
  getHighScoreFromChanges,
} from "../../utils/gameUtils";

// High Score Notification Event
interface HighScoreEvent extends NotificationEvent {
  score: number;
  playerName: string;
  previousHighScore: number;
}

// High Score Detector
const highScoreDetector: NotificationDetector<HighScoreEvent> = (
  update,
  divisionData,
) => {
  console.log("🏆 HighScoreDetector: Checking for new high scores...");

  // Get the highest score from just the changes for our division
  const changesHighScore = getHighScoreFromChanges(
    update.changes,
    divisionData.division.id,
    divisionData.players,
  );

  // Get the previous high score for the division (0 if no previous data)
  const previousHighScore = update.previousData
    ? getHighScoreForDivision(update.previousData, divisionData.division.id)
    : { score: 0, playerName: "", gameId: 0 };

  // Check if the highest score in the changes beats the previous record (or is the first score)
  if (
    changesHighScore.score > previousHighScore.score &&
    changesHighScore.score > 0
  ) {
    console.log(
      `🏆 NEW HIGH SCORE! ${changesHighScore.playerName}: ${changesHighScore.score} (was ${previousHighScore.score})`,
    );

    return {
      id: `high-score-${Date.now()}`,
      timestamp: Date.now(),
      score: changesHighScore.score,
      playerName: changesHighScore.playerName,
      previousHighScore: previousHighScore.score,
    };
  }
  return null;
};

// High Score Renderer
const HighScoreRenderer: NotificationRenderer<HighScoreEvent> = ({
  event,
  divisionData,
}) => (
  <div className="relative bg-white text-gray-900 p-4 sm:p-6 lg:p-12 rounded-lg shadow-2xl border-2 border-gray-300 w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto">
    <div className="text-center space-y-2 sm:space-y-4 lg:space-y-6">
      {/* Title */}
      <div className="text-lg sm:text-2xl lg:text-4xl font-black text-gray-800">
        NEW HIGH SCORE!
      </div>

      {/* Score - The star of the show */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-3 sm:p-6 lg:p-8 shadow-inner">
        <div className="text-3xl sm:text-5xl lg:text-8xl font-black">
          {event.score}
        </div>
      </div>

      {/* Player Name */}
      <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800">
        {event.playerName}
      </div>

      {/* Previous Record */}
      <div className="text-sm sm:text-lg lg:text-2xl text-gray-600 font-semibold">
        Previous: {event.previousHighScore}
      </div>

      {/* Division Name */}
      <div className="text-xs sm:text-base lg:text-xl text-gray-500 font-medium">
        Division {divisionData.division.name}
      </div>
    </div>
  </div>
);

const HighScoreAnimation: React.FC = () => {
  return (
    <TournamentNotificationOverlay
      notificationConfigs={[
        {
          detector: highScoreDetector,
          renderer: HighScoreRenderer,
          displayDurationMs: 5000,
        },
      ]}
    />
  );
};

export default HighScoreAnimation;
