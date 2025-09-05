import React from "react";
import { useSearchParams } from "react-router-dom";

import { BaseOverlay } from "../../../components/shared/BaseOverlay";
import { BaseModernOverlay } from "../../../components/shared/BaseModernOverlay";
import GameHistoryDisplay from "../../../components/shared/GameHistoryDisplay";
import PointsDisplay from "../../../components/shared/PointsDisplay";
import { RankedPlayerStats } from "../../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../../services/interfaces";
import * as Stats from "../../../types/stats";
import { Theme } from "../../../types/theme";
import { getRecentGamesForPlayer } from "../../../utils/gameUtils";
import {
  formatSpread,
  formatRecord,
  formatUnderCamRecord,
  formatFullUnderCam,
  formatUnderCamNoSeed,
  formatFullUnderCamWithRating,
  formatBestOf7,
} from "../../../utils/playerUtils";

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
  | "tournament-data";

const MiscModernOverlay: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as SourceType;

  return (
    <BaseOverlay apiService={apiService}>
      {({ tournament, divisionData, divisionName, currentMatch }) => (
        <BaseModernOverlay
          tournamentId={tournament.id}
          tournamentTheme={tournament.theme || 'scrabble'}
        >
          {(theme, themeClasses) => {
        if (!source) {
          return (
            <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
              <div className={`${theme.colors.textPrimary}`}>No source parameter provided</div>
            </div>
          );
        }

            if (!currentMatch) {
              return (
                <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                  <div className={`${theme.colors.textPrimary}`}>No current match data available</div>
                </div>
              );
            }

        // Calculate player stats from raw data (same as UsePlayerStatsCalculation does)
        const {
          calculateStandingsFromGames,
        } = require("../../../utils/calculateStandings");
        const playerStats = calculateStandingsFromGames(
          divisionData.games,
          divisionData.players,
        );

        // Sort by standings and add ranks
        const rankedPlayers = playerStats
          .sort((a: Stats.PlayerStats, b: Stats.PlayerStats) => {
            if (a.wins !== b.wins) return b.wins - a.wins;
            if (a.losses !== b.losses) return a.losses - b.losses;
            return b.spread - a.spread;
          })
          .map((player: Stats.PlayerStats, index: number) => ({
            ...player,
            rank: index + 1,
            rankOrdinal: `${index + 1}${["th", "st", "nd", "rd"][(index + 1) % 100 > 10 && (index + 1) % 100 < 14 ? 0 : (index + 1) % 10] || "th"}`,
          }));

        // Find the current pairing/game to get player IDs
        const currentGame = divisionData.games.find(
          (game) =>
            game.pairingId === currentMatch.pairingId &&
            game.roundNumber === currentMatch.round,
        );

              if (!currentGame) {
                return (
                  <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                    <div className={`${theme.colors.textPrimary}`}>Current game not found in tournament data</div>
                  </div>
                );
              }

        // Find the two players from current game
        const player1Stats = rankedPlayers.find(
          (p: RankedPlayerStats) => p.playerId === currentGame.player1Id,
        );
        const player2Stats = rankedPlayers.find(
          (p: RankedPlayerStats) => p.playerId === currentGame.player2Id,
        );

              if (!player1Stats || !player2Stats) {
                return (
                  <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                    <div className={`${theme.colors.textPrimary}`}>Players not found in tournament data</div>
                  </div>
                );
              }

        const renderPlayerData = (source: SourceType) => {
          const isPlayer1 = source.startsWith("player1");
          const player = isPlayer1 ? player1Stats : player2Stats;
          const side = isPlayer1 ? "player1" : "player2";
          const playerId = isPlayer1
            ? currentGame.player1Id
            : currentGame.player2Id;

              // Style wrapper for modern look
              const wrapInModernStyle = (content: React.ReactNode, large: boolean = false) => (
                <div className={`${theme.colors.cardBackground} rounded-2xl p-6 border-2 ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor}`}>
                  <div className={`${theme.colors.textPrimary} ${large ? 'text-2xl' : 'text-xl'} font-bold`}>
                    {content}
                  </div>
                </div>
              );

          switch (source) {
            case "player1-name":
            case "player2-name":
              return wrapInModernStyle(player.firstLast || "Player", true);

            case "player1-record":
            case "player2-record":
              return wrapInModernStyle(
                <div>
                  <span className={theme.colors.textAccent}>Record:</span> {formatRecord(player)}
                </div>
              );

            case "player1-average-score":
            case "player2-average-score":
              return wrapInModernStyle(
                <div>
                  <span className={theme.colors.textAccent}>Average Score:</span> {player.averageScoreRounded || "N/A"}
                </div>
              );

            case "player1-high-score":
            case "player2-high-score":
              return wrapInModernStyle(
                <div>
                  <span className={theme.colors.textAccent}>High Score:</span> {player.highScore || "N/A"}
                </div>
              );

            case "player1-spread":
            case "player2-spread":
              return wrapInModernStyle(
                <div>
                  <span className={theme.colors.textAccent}>Spread:</span> {formatSpread(player.spread)}
                </div>
              );

            case "player1-rank":
            case "player2-rank":
              return wrapInModernStyle(
                <div>
                  <span className={theme.colors.textAccent}>Rank:</span> {player.rank || "N/A"}
                </div>
              );

            case "player1-rank-ordinal":
            case "player2-rank-ordinal":
              return wrapInModernStyle(player.rankOrdinal || "N/A", true);

            case "player1-rating":
            case "player2-rating":
              return wrapInModernStyle(
                <div>
                  <span className={theme.colors.textAccent}>Rating:</span> {player.currentRating || "N/A"}
                </div>
              );

            case "player1-under-cam":
            case "player2-under-cam":
              return wrapInModernStyle(formatFullUnderCam(player));

            case "player1-under-cam-no-seed":
            case "player2-under-cam-no-seed":
              return wrapInModernStyle(formatUnderCamNoSeed(player));

            case "player1-under-cam-small":
            case "player2-under-cam-small":
              return wrapInModernStyle(formatUnderCamRecord(player));

            case "player1-under-cam-with-rating":
            case "player2-under-cam-with-rating":
              return wrapInModernStyle(formatFullUnderCamWithRating(player));

            case "player1-bo7":
            case "player2-bo7":
              return wrapInModernStyle(formatBestOf7(player), true);

            case "player1-points":
            case "player2-points":
            case "player1-game-history":
            case "player2-game-history":
              const recentGames = getRecentGamesForPlayer(
                playerId,
                divisionData.games,
                divisionData.players,
              );
              return (
                <div className={`${theme.colors.cardBackground} rounded-2xl p-6 border-2 ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor}`}>
                  <div className={`${theme.colors.textPrimary} mb-4`}>
                    <PointsDisplay stats={player} side={side} />
                  </div>
                  <div className={`${theme.colors.textPrimary}`}>
                    <GameHistoryDisplay games={recentGames} side={side} />
                  </div>
                </div>
              );

            case "player1-game-history-small":
            case "player2-game-history-small":
              const recentGamesSmall = getRecentGamesForPlayer(
                playerId,
                divisionData.games,
                divisionData.players,
              );
              return (
                <div className={`${theme.colors.cardBackground} rounded-2xl p-6 border-2 ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor}`}>
                  <div className={`${theme.colors.textPrimary}`}>
                    <GameHistoryDisplay games={recentGamesSmall} side={side} />
                  </div>
                </div>
              );

            case "tournament-data":
              return wrapInModernStyle(
                <div>
                  <span className={theme.colors.textAccent}>{tournament.name || "N/A"}</span>
                  <span className={theme.colors.textSecondary}> | </span>
                  <span className={theme.colors.textAccent}>{tournament.lexicon || "N/A"}</span>
                  <span className={theme.colors.textSecondary}> | </span>
                  <span className={theme.colors.textAccent}>Round {currentMatch.round || "N/A"}</span>
                </div>
              );

            default:
              return null;
          }
        };

              return (
                <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
                  {renderPlayerData(source)}
                </div>
              );
          }}
        </BaseModernOverlay>
      )}
    </BaseOverlay>
  );
};

export default MiscModernOverlay;