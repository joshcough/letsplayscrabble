import React from "react";
import { useSearchParams } from "react-router-dom";

import * as DB from "@shared/types/database";

import { BaseOverlay } from "../../components/shared/BaseOverlay";
import GameHistoryDisplay from "../../components/shared/GameHistoryDisplay";
import PointsDisplay from "../../components/shared/PointsDisplay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { getRecentGamesForPlayer } from "../../utils/gameUtils";
import {
  formatSpread,
  formatRecord,
  formatUnderCamRecord,
  formatFullUnderCam,
  formatUnderCamNoSeed,
  formatFullUnderCamWithRating,
  formatBestOf7,
} from "../../utils/playerUtils";

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

const MiscOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as SourceType;

  if (!source) {
    return <div className="text-black p-2">No source parameter provided</div>;
  }

  return (
    <BaseOverlay>
      {({ tournament, divisionData, divisionName, currentMatch }) => {
        // Early return for errors
        if (!currentMatch) {
          return (
            <div className="text-black p-2">
              No current match data available
            </div>
          );
        }

        // Calculate player stats from raw data (same as UsePlayerStatsCalculation does)
        const {
          calculateStandingsFromGames,
        } = require("../../utils/calculateStandings");
        const playerStats = calculateStandingsFromGames(
          divisionData.games,
          divisionData.players,
        );

        // Sort by standings and add ranks
        const rankedPlayers = playerStats
          .sort((a: any, b: any) => {
            if (a.wins !== b.wins) return b.wins - a.wins;
            if (a.losses !== b.losses) return a.losses - b.losses;
            return b.spread - a.spread;
          })
          .map((player: any, index: number) => ({
            ...player,
            rank: index + 1,
            rankOrdinal: `${index + 1}${["th", "st", "nd", "rd"][(index + 1) % 100 > 10 && (index + 1) % 100 < 14 ? 0 : (index + 1) % 10] || "th"}`,
          }));

        // Find the current pairing/game to get player IDs
        const currentGame = divisionData.games.find(
          (game) =>
            game.pairing_id === currentMatch.pairing_id &&
            game.round_number === currentMatch.round,
        );

        if (!currentGame) {
          return (
            <div className="text-black p-2">
              Current game not found in tournament data
            </div>
          );
        }

        // Find the two players from current game
        const player1Stats = rankedPlayers.find(
          (p: any) => p.playerId === currentGame.player1_id,
        );
        const player2Stats = rankedPlayers.find(
          (p: any) => p.playerId === currentGame.player2_id,
        );

        if (!player1Stats || !player2Stats) {
          return (
            <div className="text-black p-2">
              Players not found in tournament data
            </div>
          );
        }

        const renderPlayerData = (source: SourceType) => {
          const isPlayer1 = source.startsWith("player1");
          const player = isPlayer1 ? player1Stats : player2Stats;
          const side = isPlayer1 ? "player1" : "player2";
          const playerId = isPlayer1
            ? currentGame.player1_id
            : currentGame.player2_id;

          switch (source) {
            case "player1-name":
            case "player2-name":
              return (
                <div className="text-black">{player.firstLast || "Player"}</div>
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
                  Average Score: {player.averageScoreRounded || "N/A"}
                </div>
              );

            case "player1-high-score":
            case "player2-high-score":
              return (
                <div className="text-black">
                  High Score: {player.highScore || "N/A"}
                </div>
              );

            case "player1-spread":
            case "player2-spread":
              return (
                <div className="text-black">
                  Spread: {formatSpread(player.spread)}
                </div>
              );

            case "player1-rank":
            case "player2-rank":
              return (
                <div className="text-black">Rank: {player.rank || "N/A"}</div>
              );

            case "player1-rank-ordinal":
            case "player2-rank-ordinal":
              return (
                <div className="text-black">{player.rankOrdinal || "N/A"}</div>
              );

            case "player1-rating":
            case "player2-rating":
              return (
                <div className="text-black">
                  Rating: {player.currentRating || "N/A"}
                </div>
              );

            case "player1-under-cam":
            case "player2-under-cam":
              return (
                <div className="text-black">{formatFullUnderCam(player)}</div>
              );

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
              const recentGames = getRecentGamesForPlayer(
                playerId,
                divisionData.games,
                divisionData.players,
              );
              return (
                <div>
                  <div className="text-black">
                    <PointsDisplay stats={player} side={side} />
                  </div>
                  <div className="text-black">
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
                <GameHistoryDisplay games={recentGamesSmall} side={side} />
              );

            case "tournament-data":
              return (
                <div className="text-black">
                  {tournament.name || "N/A"}
                  {" | "}
                  {tournament.lexicon || "N/A"}
                  {" | Round "}
                  {currentMatch.round || "N/A"}
                </div>
              );

            default:
              return null;
          }
        };

        return (
          <div className="inline-block text-black">
            {renderPlayerData(source)}
          </div>
        );
      }}
    </BaseOverlay>
  );
};

export default MiscOverlay;
