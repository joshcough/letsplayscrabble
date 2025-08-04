import React from "react";
import { TournamentDataIncremental } from "@shared/types/broadcast";
import { PlayerRow } from "@shared/types/database";
import { didPlayerWinGame, calculateWinStreak } from "../../utils/gameUtils";

// Winning streak data structure
interface WinningStreakData {
  playerName: string;
  streakLength: number;
}

// 1. Detection logic - returns data or null
const detectWinningStreak = (update: TournamentDataIncremental, divisionData: any): WinningStreakData | null => {
  console.log('🔥 WinningStreakDetector: Checking for win streaks...');

  // Only look at newly added or updated games in this division
  const relevantChanges = [
    ...update.changes.added.filter(g => g.division_id === divisionData.division.id),
    ...update.changes.updated.filter(g => g.division_id === divisionData.division.id)
  ].filter(game => game.player1_score !== null && game.player2_score !== null); // Only completed games

  if (relevantChanges.length === 0) {
    console.log('🔥 WinningStreakDetector: No relevant completed games in changes');
    return null;
  }

  // Get all games in the current data for streak calculation
  const allCurrentGames = update.data?.divisions
    .find(d => d.division.id === divisionData.division.id)?.games || [];

  // Check each changed game to see if it resulted in a notable win streak
  for (const game of relevantChanges) {
    // Check both players in the game
    const playerIds = [game.player1_id, game.player2_id];

    for (const playerId of playerIds) {
      if (didPlayerWinGame(game, playerId)) {
        const currentStreak = calculateWinStreak(playerId, allCurrentGames);

        console.log(`🔥 Player ${playerId} current streak: ${currentStreak}`);

        // Trigger notification for streaks of 3+ games
        if (currentStreak >= 3) {
          const player = divisionData.players.find((p:PlayerRow) => p.id === playerId);

          if (player) {
            console.log(`🔥 WIN STREAK DETECTED! ${player.name}: ${currentStreak} games`);

            return {
              playerName: player.name,
              streakLength: currentStreak,
            };
          }
        }
      }
    }
  }

  console.log('🔥 WinningStreakDetector: No notable win streaks found');
  return null;
};

// 2. Render logic - pure UI component
const renderWinningStreak = (data: WinningStreakData, divisionData: any): JSX.Element => (
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
        Division {divisionData.division.name}
      </div>
    </div>
  </div>
);

// 3. Combined detector - calls detect, then render
export const winningStreakDetector = (update: TournamentDataIncremental, divisionData: any): JSX.Element | null => {
  const data = detectWinningStreak(update, divisionData);
  if (!data) return null;
  return renderWinningStreak(data, divisionData);
};