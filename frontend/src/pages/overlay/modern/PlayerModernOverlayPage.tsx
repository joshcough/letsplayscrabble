import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

import * as Domain from "@shared/types/domain";
import {
  BaseOverlay,
  TournamentDisplayData,
} from "../../../components/shared/BaseOverlay";
import GameHistoryDisplay from "../../../components/shared/GameHistoryDisplay";
import { LoadingErrorWrapper } from "../../../components/shared/LoadingErrorWrapper";
import PointsDisplay from "../../../components/shared/PointsDisplay";
import { RankedPlayerStats } from "../../../hooks/usePlayerStatsCalculation";
import { useTournamentData } from "../../../hooks/useTournamentData";
import { ApiService } from "../../../services/interfaces";
import * as Stats from "../../../types/stats";
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

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
};

type SourceType =
  | "name"
  | "record"
  | "average-score"
  | "high-score"
  | "spread"
  | "rank"
  | "rank-ordinal"
  | "rating"
  | "under-cam"
  | "under-cam-no-seed"
  | "under-cam-small"
  | "under-cam-with-rating"
  | "points"
  | "game-history"
  | "game-history-small"
  | "bo7"
  | "tournament-info";

// Render function for player data
const renderPlayerData = (
  source: SourceType,
  player: RankedPlayerStats,
  divisionData?: Domain.Division,
  tournament?: TournamentDisplayData,
) => {
  if (!player && source !== "tournament-info") {
    return <div className="text-white">Player not found</div>;
  }

  // Wrapper for modern styling
  const wrapInModernStyle = (content: React.ReactNode, large: boolean = false) => (
    <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-400/50 shadow-2xl shadow-blue-400/10">
      <div className={`text-white ${large ? 'text-3xl' : 'text-xl'} font-bold`}>
        {content}
      </div>
    </div>
  );

  switch (source) {
    case "name":
      return wrapInModernStyle(player.firstLast || player.name || "Player", true);

    case "record":
      return wrapInModernStyle(formatRecord(player));

    case "average-score":
      return wrapInModernStyle(
        <div>
          <span className="text-blue-300">Average Score:</span> {player.averageScoreRounded || "N/A"}
        </div>
      );

    case "high-score":
      return wrapInModernStyle(
        <div>
          <span className="text-blue-300">High Score:</span> {player.highScore || "N/A"}
        </div>
      );

    case "spread":
      return wrapInModernStyle(
        <div>
          <span className="text-blue-300">Spread:</span> {formatSpread(player.spread)}
        </div>
      );

    case "rank":
      return wrapInModernStyle(
        <div>
          <span className="text-blue-300">Rank:</span> #{player.rank || "N/A"}
        </div>
      );

    case "rank-ordinal":
      return wrapInModernStyle(player.rankOrdinal || "N/A", true);

    case "rating":
      return wrapInModernStyle(
        <div>
          <span className="text-blue-300">Rating:</span> {player.currentRating || "N/A"}
        </div>
      );

    case "under-cam":
      return wrapInModernStyle(formatFullUnderCam(player));

    case "under-cam-no-seed":
      return wrapInModernStyle(formatUnderCamNoSeed(player));

    case "under-cam-small":
      return wrapInModernStyle(formatUnderCamRecord(player));

    case "under-cam-with-rating":
      return wrapInModernStyle(formatFullUnderCamWithRating(player));

    case "bo7":
      return wrapInModernStyle(formatBestOf7(player), true);

    case "points":
      return (
        <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-400/50 shadow-2xl shadow-blue-400/10">
          <div className="text-white">
            <PointsDisplay stats={player} side="player1" />
          </div>
        </div>
      );

    case "game-history":
      const recentGames = getRecentGamesForPlayer(
        player.playerId,
        divisionData?.games || [],
        divisionData?.players || [],
      );
      return (
        <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-400/50 shadow-2xl shadow-blue-400/10">
          <div className="text-white mb-4">
            <PointsDisplay stats={player} side="player1" />
          </div>
          <div className="text-white">
            <GameHistoryDisplay games={recentGames} side="player1" />
          </div>
        </div>
      );

    case "game-history-small":
      const recentGamesSmall = getRecentGamesForPlayer(
        player.playerId,
        divisionData?.games || [],
        divisionData?.players || [],
      );
      return (
        <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-400/50 shadow-2xl shadow-blue-400/10">
          <div className="text-white">
            <GameHistoryDisplay games={recentGamesSmall} side="player1" />
          </div>
        </div>
      );

    case "tournament-info":
      return wrapInModernStyle(
        <div>
          <span className="text-blue-300">{tournament?.name || "N/A"}</span>
          <span className="text-gray-400"> | </span>
          <span className="text-purple-300">{tournament?.lexicon || "N/A"}</span>
          <span className="text-gray-400"> | </span>
          <span className="text-green-300">Division {divisionData?.name || "N/A"}</span>
        </div>
      );

    default:
      return wrapInModernStyle(`Unknown source: ${source}`);
  }
};

// Component for URL-based player display
const URLBasedPlayerDisplay: React.FC<{
  tournamentId: number;
  divisionName: string;
  source: SourceType;
  playerIdParam: string | null;
  playerNameParam: string | null;
  playerParam: string | null;
  apiService: ApiService;
}> = ({
  tournamentId,
  divisionName,
  source,
  playerIdParam,
  playerNameParam,
  playerParam,
  apiService,
}) => {
  const {
    tournamentData,
    loading: dataLoading,
    fetchError,
  } = useTournamentData({
    tournamentId: tournamentId,
    useUrlParams: false,
    apiService,
  });

  // Find the target division
  const targetDivision = tournamentData?.divisions.find(
    (div) => div.name.toUpperCase() === divisionName.toUpperCase(),
  );

  // Calculate player stats
  const playerStats = React.useMemo(() => {
    if (!targetDivision) return [];

    const {
      calculateStandingsFromGames,
    } = require("../../../utils/calculateStandings");
    const stats = calculateStandingsFromGames(
      targetDivision.games,
      targetDivision.players,
    );

    // Sort by standings and add ranks
    return stats
      .sort((a: Stats.PlayerStats, b: Stats.PlayerStats) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.spread - a.spread;
      })
      .map(
        (player: Stats.PlayerStats, index: number): RankedPlayerStats => ({
          ...player,
          rank: index + 1,
          rankOrdinal: `${index + 1}${["th", "st", "nd", "rd"][(index + 1) % 100 > 10 && (index + 1) % 100 < 14 ? 0 : (index + 1) % 10] || "th"}`,
        }),
      );
  }, [targetDivision]);

  // Find the target player
  const targetPlayer = React.useMemo(() => {
    if (!playerStats.length) return null;

    if (playerIdParam) {
      const playerId = Number(playerIdParam);
      return (
        playerStats.find((p: RankedPlayerStats) => p.playerId === playerId) ||
        null
      );
    }

    if (playerNameParam) {
      return (
        playerStats.find(
          (p: RankedPlayerStats) =>
            p.firstLast
              ?.toLowerCase()
              .includes(playerNameParam.toLowerCase()) ||
            p.name?.toLowerCase().includes(playerNameParam.toLowerCase()),
        ) || null
      );
    }

    if (playerParam) {
      // For current match mode with URL parameters, we need to find the current match
      // This is a bit more complex - we'd need current match data
      // For now, return null and handle this case
      return null;
    }

    return null;
  }, [playerStats, playerIdParam, playerNameParam, playerParam]);

  return (
    <LoadingErrorWrapper loading={dataLoading} error={fetchError}>
      {(() => {
        // Additional validation after data is loaded
        if (!dataLoading && !fetchError && !targetDivision) {
          return (
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
              <div className="text-white">
                Division "{divisionName}" not found in this tournament
              </div>
            </div>
          );
        }

        if (
          !dataLoading &&
          !fetchError &&
          targetDivision &&
          !targetPlayer &&
          source !== "tournament-info"
        ) {
          return (
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
              <div className="text-white">
                Player{" "}
                {playerIdParam || playerNameParam || `player ${playerParam}`} not
                found in division {divisionName}
              </div>
            </div>
          );
        }

        if (tournamentData && targetDivision) {
          return (
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
              {renderPlayerData(
                source,
                targetPlayer,
                targetDivision,
                tournamentData,
              )}
            </div>
          );
        }

        return (
          <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
            <div className="text-white">Loading...</div>
          </div>
        );
      })()}
    </LoadingErrorWrapper>
  );
};

const PlayerModernOverlay: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { userId, tournamentId, divisionName } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as SourceType;
  const playerIdParam = searchParams.get("playerId");
  const playerNameParam = searchParams.get("playerName");
  const playerParam = searchParams.get("player"); // "1" or "2" for current match

  console.log("🎯 PlayerModernOverlay params:", {
    userId,
    tournamentId,
    divisionName,
    source,
    playerIdParam,
    playerNameParam,
    playerParam,
  });

  // Determine what mode we're in
  const shouldUseCurrentMatch = !tournamentId;
  const hasSpecificPlayer = !!(playerIdParam || playerNameParam);
  const hasCurrentMatchPlayer = !!playerParam;

  console.log("🎯 Mode flags:", {
    shouldUseCurrentMatch,
    hasSpecificPlayer,
    hasCurrentMatchPlayer,
  });

  // Validation
  if (!source) {
    return (
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
        <div className="text-white">Source parameter is required</div>
      </div>
    );
  }

  if (shouldUseCurrentMatch) {
    // Current match mode - must specify player 1 or 2
    if (!hasCurrentMatchPlayer) {
      return (
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
          <div className="text-white">
            Current match mode requires player parameter (1 or 2)
          </div>
        </div>
      );
    }

    return (
      <BaseOverlay apiService={apiService}>
        {({
          tournament,
          divisionData,
          divisionName: currentDivisionName,
          currentMatch,
        }) => {
          console.log("🎯 BaseOverlay data:", {
            tournament,
            divisionData,
            currentDivisionName,
            currentMatch,
          });

          if (!currentMatch) {
            return (
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
                <div className="text-white">
                  No current match data available
                </div>
              </div>
            );
          }

          // Find the current game
          const currentGame = divisionData.games.find(
            (game) =>
              game.pairingId === currentMatch.pairingId &&
              game.roundNumber === currentMatch.round,
          );

          if (!currentGame) {
            return (
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
                <div className="text-white">
                  Current game not found in tournament data
                </div>
              </div>
            );
          }

          // Calculate player stats
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
            .map(
              (
                player: Stats.PlayerStats,
                index: number,
              ): RankedPlayerStats => ({
                ...player,
                rank: index + 1,
                rankOrdinal: `${index + 1}${["th", "st", "nd", "rd"][(index + 1) % 100 > 10 && (index + 1) % 100 < 14 ? 0 : (index + 1) % 10] || "th"}`,
              }),
            );

          // Get the right player based on parameter
          const isPlayer1 = playerParam === "1";
          const targetPlayerId = isPlayer1
            ? currentGame.player1Id
            : currentGame.player2Id;
          const targetPlayer = rankedPlayers.find(
            (p: RankedPlayerStats) => p.playerId === targetPlayerId,
          );

          if (!targetPlayer) {
            return (
              <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
                <div className="text-white">
                  Player {playerParam} not found in tournament data
                </div>
              </div>
            );
          }

          return (
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
              {renderPlayerData(source, targetPlayer, divisionData, tournament)}
            </div>
          );
        }}
      </BaseOverlay>
    );
  } else {
    // URL-based mode
    if (!tournamentId || !divisionName) {
      return (
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
          <div className="text-white">
            Tournament ID and division name are required in URL
          </div>
        </div>
      );
    }

    if (!hasSpecificPlayer && !hasCurrentMatchPlayer) {
      return (
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
          <div className="text-white">
            Either playerId, playerName, or player parameter is required
          </div>
        </div>
      );
    }

    return (
      <URLBasedPlayerDisplay
        tournamentId={Number(tournamentId)}
        divisionName={divisionName}
        source={source}
        playerIdParam={playerIdParam}
        playerNameParam={playerNameParam}
        playerParam={playerParam}
        apiService={apiService}
      />
    );
  }
};

export default PlayerModernOverlay;