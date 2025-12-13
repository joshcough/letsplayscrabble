import React from "react";

import { TournamentDataIncremental } from "../../types/broadcast";
import * as Domain from "@shared/types/domain";
import {
  getHighScoreForDivision,
  getHighScoreFromChanges,
} from "../../utils/gameUtils";

// High score data structure
interface HighScoreData {
  score: number;
  playerName: string;
  previousHighScore: number;
}

// 1. Detection logic - returns data or null
const detectHighScore = (
  update: TournamentDataIncremental,
  divisionData: Domain.Division,
): HighScoreData | null => {
  console.log("🏆 HighScoreDetector: Checking for new high scores...");

  // Get the highest score from just the changes for our division
  const changesHighScore = getHighScoreFromChanges(
    update.changes,
    divisionData.id,
    divisionData.players,
  );

  // TODO: previousData was removed from broadcasts to reduce memory usage by ~50%
  // When re-enabling notifications, either:
  // 1. Pre-calculate previousHighScore in WorkerSocketManager and add to metadata
  // 2. Or re-enable previousData field in TournamentDataIncremental
  // For now, this detector is non-functional (NotificationManager returns early)

  // Get the previous high score for the division (0 if no previous data)
  // previousData is now division-scoped, so we can calculate directly from it
  const previousHighScore = { score: 0, playerName: "", gameId: 0 }; // update.previousData removed

  // Helper to calculate high score from games
  function getHighScoreFromGames(games: Domain.Game[], players: Domain.Player[]) {
    let highScore = 0;
    let highScorePlayerName = "";
    let highScoreGameId = 0;

    for (const game of games) {
      if (game.player1Score && game.player1Score > highScore) {
        highScore = game.player1Score;
        const player = players.find((p) => p.id === game.player1Id);
        highScorePlayerName = player?.name || "Unknown";
        highScoreGameId = game.id;
      }
      if (game.player2Score && game.player2Score > highScore) {
        highScore = game.player2Score;
        const player = players.find((p) => p.id === game.player2Id);
        highScorePlayerName = player?.name || "Unknown";
        highScoreGameId = game.id;
      }
    }

    return { score: highScore, playerName: highScorePlayerName, gameId: highScoreGameId };
  }

  // Check if the highest score in the changes beats the previous record (or is the first score)
  if (
    changesHighScore.score > previousHighScore.score &&
    changesHighScore.score > 0
  ) {
    console.log(
      `🏆 NEW HIGH SCORE! ${changesHighScore.playerName}: ${changesHighScore.score} (was ${previousHighScore.score})`,
    );

    return {
      score: changesHighScore.score,
      playerName: changesHighScore.playerName,
      previousHighScore: previousHighScore.score,
    };
  }

  return null;
};

// 2. Render logic - pure UI component
const renderHighScore = (
  data: HighScoreData,
  divisionData: Domain.Division,
): JSX.Element => (
  <div className="relative bg-white text-gray-900 p-4 sm:p-6 lg:p-12 rounded-lg shadow-2xl border-2 border-gray-300 w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto">
    <div className="text-center space-y-2 sm:space-y-4 lg:space-y-6">
      {/* Title */}
      <div className="text-lg sm:text-2xl lg:text-4xl font-black text-gray-800">
        NEW HIGH SCORE!
      </div>

      {/* Score - The star of the show */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-3 sm:p-6 lg:p-8 shadow-inner">
        <div className="text-3xl sm:text-5xl lg:text-8xl font-black">
          {data.score}
        </div>
      </div>

      {/* Player Name */}
      <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800">
        {data.playerName}
      </div>

      {/* Previous Record */}
      <div className="text-sm sm:text-lg lg:text-2xl text-gray-600 font-semibold">
        Previous: {data.previousHighScore}
      </div>

      {/* Division Name */}
      <div className="text-xs sm:text-base lg:text-xl text-gray-500 font-medium">
        Division {divisionData.name}
      </div>
    </div>
  </div>
);

// 3. Combined detector - calls detect, then return component with props
export const highScoreDetector = (
  update: TournamentDataIncremental,
  divisionData: Domain.Division,
): JSX.Element | null => {
  const data = detectHighScore(update, divisionData);
  if (!data) return null;
  // Return the HighScore component (function) instead of rendered JSX
  // This allows NotificationManager to extract the props
  return <HighScore playerName={data.playerName} score={data.score} previousHighScore={data.previousHighScore} />;
};

// Export a simple component for direct use
export const HighScore: React.FC<{
  playerName: string;
  score: number;
  previousHighScore?: number;
  playerPhoto?: string;
}> = ({ playerName, score, previousHighScore, playerPhoto }) => {
  return (
    <div className="relative bg-white text-gray-900 p-3 rounded-lg shadow-2xl border-4 border-green-500" style={{ margin: 0, width: '100%', height: '100%', minWidth: '290px' }}>
      <div className="flex items-center justify-center h-full gap-2">
        {/* Player Photo */}
        {playerPhoto && (
          <div className="flex-shrink-0">
            <img 
              src={playerPhoto} 
              alt={playerName}
              className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="text-center space-y-1">
          {/* Title */}
          <div className="text-sm font-black text-green-600">
            NEW HIGH SCORE!
          </div>

          {/* Score - The star of the show */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded p-1">
            <div className="text-lg font-black">
              {score}
            </div>
          </div>

          {/* Player Name */}
          <div className="text-sm font-bold text-gray-800">
            {playerName}
          </div>

          {/* Previous Record */}
          {previousHighScore && (
            <div className="text-xs text-gray-600 font-semibold">
              Previous: {previousHighScore}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
