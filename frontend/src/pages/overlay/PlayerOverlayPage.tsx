import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

import {
  BaseOverlay,
  TournamentDisplayData,
  DivisionData,
} from "../../components/shared/BaseOverlay";
import GameHistoryDisplay from "../../components/shared/GameHistoryDisplay";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import PointsDisplay from "../../components/shared/PointsDisplay";
import { RankedPlayerStats } from "../../hooks/usePlayerStatsCalculation";
import { useTournamentData } from "../../hooks/useTournamentData";
import { ApiService } from "../../services/interfaces";
import * as Stats from "../../types/stats";
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
  divisionData?: DivisionData,
  tournament?: TournamentDisplayData,
) => {
  if (!player && source !== "tournament-info") {
    return <div>Player not found</div>;
  }

  switch (source) {
    case "name":
      return <div>{player.firstLast || player.name || "Player"}</div>;

    case "record":
      return <div>{formatRecord(player)}</div>;

    case "average-score":
      return <div>{player.averageScoreRounded || "N/A"}</div>;

    case "high-score":
      return <div>{player.highScore || "N/A"}</div>;

    case "spread":
      return <div>{formatSpread(player.spread)}</div>;

    case "rank":
      return <div>{player.rank || "N/A"}</div>;

    case "rank-ordinal":
      return <div>{player.rankOrdinal || "N/A"}</div>;

    case "rating":
      return <div>{player.currentRating || "N/A"}</div>;

    case "under-cam":
      return <div>{formatFullUnderCam(player)}</div>;

    case "under-cam-no-seed":
      return <div>{formatUnderCamNoSeed(player)}</div>;

    case "under-cam-small":
      return <div>{formatUnderCamRecord(player)}</div>;

    case "under-cam-with-rating":
      return <div>{formatFullUnderCamWithRating(player)}</div>;

    case "bo7":
      return <div>{formatBestOf7(player)}</div>;

    case "points":
      return <PointsDisplay stats={player} side="player1" />;

    case "game-history":
      const recentGames = getRecentGamesForPlayer(
        player.playerId,
        divisionData?.games || [],
        divisionData?.players || [],
      );
      return (
        <div>
          <div className="mb-2">
            <PointsDisplay stats={player} side="player1" />
          </div>
          <GameHistoryDisplay games={recentGames} side="player1" />
        </div>
      );

    case "game-history-small":
      const recentGamesSmall = getRecentGamesForPlayer(
        player.playerId,
        divisionData?.games || [],
        divisionData?.players || [],
      );
      return <GameHistoryDisplay games={recentGamesSmall} side="player1" />;

    case "tournament-info":
      return (
        <div>
          {tournament?.name || "N/A"}
          {" | "}
          {tournament?.lexicon || "N/A"}
          {" | "}
          Division {divisionData?.name || "N/A"}
        </div>
      );

    default:
      return <div>Unknown source: {source}</div>;
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
    } = require("../../utils/calculateStandings");
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
            <div className="text-black p-2">
              Division "{divisionName}" not found in this tournament
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
            <div className="text-black p-2">
              Player{" "}
              {playerIdParam || playerNameParam || `player ${playerParam}`} not
              found in division {divisionName}
            </div>
          );
        }

        if (tournamentData && targetDivision) {
          return (
            <div className="inline-block text-black">
              {renderPlayerData(
                source,
                targetPlayer,
                targetDivision,
                tournamentData,
              )}
            </div>
          );
        }

        return <div className="text-black p-2">Loading...</div>;
      })()}
    </LoadingErrorWrapper>
  );
};

const PlayerOverlay: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { userId, tournamentId, divisionName } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as SourceType;
  const playerIdParam = searchParams.get("playerId");
  const playerNameParam = searchParams.get("playerName");
  const playerParam = searchParams.get("player"); // "1" or "2" for current match

  console.log("🎯 PlayerOverlay params:", {
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
    return <div className="text-black p-2">Source parameter is required</div>;
  }

  if (shouldUseCurrentMatch) {
    // Current match mode - must specify player 1 or 2
    if (!hasCurrentMatchPlayer) {
      return (
        <div className="text-black p-2">
          Current match mode requires player parameter (1 or 2)
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
              <div className="text-black p-2">
                No current match data available
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
              <div className="text-black p-2">
                Current game not found in tournament data
              </div>
            );
          }

          // Calculate player stats
          const {
            calculateStandingsFromGames,
          } = require("../../utils/calculateStandings");
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
              <div className="text-black p-2">
                Player {playerParam} not found in tournament data
              </div>
            );
          }

          return (
            <div className="inline-block text-black">
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
        <div className="text-black p-2">
          Tournament ID and division name are required in URL
        </div>
      );
    }

    if (!hasSpecificPlayer && !hasCurrentMatchPlayer) {
      return (
        <div className="text-black p-2">
          Either playerId, playerName, or player parameter is required
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

export default PlayerOverlay;
