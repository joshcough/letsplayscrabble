import React from "react";

import * as Domain from "@shared/types/domain";

import { TournamentDataIncremental } from "../../types/broadcast";
import { didPlayerWinGame, calculateWinStreak } from "../../utils/gameUtils";

// Winning streak data structure
interface WinningStreakData {
  playerName: string;
  streakLength: number;
}

// 1. Detection logic - returns data or null
const detectWinningStreak = (
  update: TournamentDataIncremental,
  divisionData: any,
): WinningStreakData | null => {
  console.log("🔥 WinningStreakDetector: Checking for win streaks...");

  // Find division in the updated tournament data
  const currentDivision = update.data?.divisions.find(
    (d) => d.id === divisionData.id,
  );
  if (!currentDivision) {
    console.log("🔥 WinningStreakDetector: Division not found in updated data");
    return null;
  }

  // Only look at newly added or updated games for this division's players
  const divisionPlayerIds = new Set(currentDivision.players.map((p) => p.id));
  const relevantChanges = [
    ...update.changes.added.filter(
      (g) =>
        divisionPlayerIds.has(g.player1Id) ||
        divisionPlayerIds.has(g.player2Id),
    ),
    ...update.changes.updated.filter(
      (g) =>
        divisionPlayerIds.has(g.player1Id) ||
        divisionPlayerIds.has(g.player2Id),
    ),
  ].filter((game) => game.player1Score !== null && game.player2Score !== null); // Only completed games

  if (relevantChanges.length === 0) {
    console.log(
      "🔥 WinningStreakDetector: No relevant completed games in changes",
    );
    return null;
  }

  // Get all games in the current data for streak calculation
  const allCurrentGames = currentDivision.games;

  // Check each changed game to see if it resulted in a notable win streak
  for (const game of relevantChanges) {
    // Check both players in the game
    const playerIds = [game.player1Id, game.player2Id];

    for (const playerId of playerIds) {
      if (didPlayerWinGame(game, playerId)) {
        const currentStreak = calculateWinStreak(playerId, allCurrentGames);

        console.log(`🔥 Player ${playerId} current streak: ${currentStreak}`);

        // Trigger notification for streaks of 3+ games
        if (currentStreak >= 3) {
          const player = currentDivision.players.find((p) => p.id === playerId);

          if (player) {
            console.log(
              `🔥 WIN STREAK DETECTED! ${player.name}: ${currentStreak} games`,
            );

            return {
              playerName: player.name,
              streakLength: currentStreak,
            };
          }
        }
      }
    }
  }

  console.log("🔥 WinningStreakDetector: No notable win streaks found");
  return null;
};

// 2. Render logic - pure UI component
const renderWinningStreak = (
  data: WinningStreakData,
  divisionData: any,
): JSX.Element => (
  <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 sm:p-6 lg:p-12 rounded-lg shadow-2xl border-2 border-yellow-300 w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto">
    <div className="text-center space-y-2 sm:space-y-4 lg:space-y-6">
      {/* Title with fire emojis */}
      <div className="text-lg sm:text-2xl lg:text-4xl font-black">
        🔥 ON FIRE! 🔥
      </div>

      {/* Player Name */}
      <div className="text-xl sm:text-2xl lg:text-4xl font-bold">
        {data.playerName}
      </div>

      {/* Streak Length */}
      <div className="bg-white text-orange-600 rounded-lg p-3 sm:p-6 lg:p-8 shadow-inner">
        <div className="text-2xl sm:text-4xl lg:text-6xl font-black">
          {data.streakLength}
        </div>
        <div className="text-sm sm:text-lg lg:text-2xl font-semibold">
          Game Win Streak
        </div>
      </div>

      {/* Division Name */}
      <div className="text-xs sm:text-base lg:text-xl text-yellow-100 font-medium">
        Division {divisionData.name}
      </div>
    </div>
  </div>
);

// 3. Combined detector - calls detect, then render
export const winningStreakDetector = (
  update: TournamentDataIncremental,
  divisionData: any,
): JSX.Element | null => {
  const data = detectWinningStreak(update, divisionData);
  if (!data) return null;
  return renderWinningStreak(data, divisionData);
};
