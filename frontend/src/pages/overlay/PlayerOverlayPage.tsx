import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTournamentData } from "../../hooks/useTournamentData";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import GameHistoryDisplay from "../../components/shared/GameHistoryDisplay";
import PointsDisplay from "../../components/shared/PointsDisplay";
import * as DB from "@shared/types/database";
import {
  formatSpread,
  formatRecord,
  formatUnderCamRecord,
  formatFullUnderCam,
  formatUnderCamNoSeed,
  formatFullUnderCamWithRating,
  formatBestOf7,
} from "../../utils/statsOverlayHelpers";
import { getRecentGamesForPlayer } from "../../utils/tournamentHelpers";

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

const PlayerOverlay: React.FC = () => {
  const { userId, tournamentId, divisionName } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as SourceType;
  const playerIdParam = searchParams.get("playerId");
  const playerNameParam = searchParams.get("playerName");

  const playerId = playerIdParam ? Number(playerIdParam) : undefined;

  // Always call hooks first, before any conditional returns
  const {
    tournamentData,
    loading: dataLoading,
    fetchError,
  } = useTournamentData({
    tournamentId: tournamentId ? Number(tournamentId) : 0,
    useUrlParams: false,
  });

  // Find the target division
  const targetDivision = tournamentData?.divisions.find(
    (div) => div.division.name.toUpperCase() === divisionName?.toUpperCase(),
  );

  // Calculate player stats - always call this hook
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
  }, [targetDivision]);

  // Find the target player - always call this hook
  const targetPlayer = React.useMemo(() => {
    if (!playerStats.length) return null;

    if (playerId) {
      return playerStats.find((p: any) => p.playerId === playerId) || null;
    }

    if (playerNameParam) {
      return (
        playerStats.find(
          (p: any) =>
            p.firstLast
              ?.toLowerCase()
              .includes(playerNameParam.toLowerCase()) ||
            p.name?.toLowerCase().includes(playerNameParam.toLowerCase()),
        ) || null
      );
    }

    return null;
  }, [playerStats, playerId, playerNameParam]);

  // Now do validation after all hooks are called
  if (!tournamentId || !divisionName) {
    return (
      <div className="text-black p-2">
        Tournament ID and division name are required in URL
      </div>
    );
  }

  if (!source) {
    return <div className="text-black p-2">Source parameter is required</div>;
  }

  if (!playerIdParam && !playerNameParam) {
    return (
      <div className="text-black p-2">
        Either playerId or playerName parameter is required
      </div>
    );
  }

  const renderPlayerData = (source: SourceType, player: any) => {
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
          targetDivision!.games,
          targetDivision!.players,
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
          targetDivision!.games,
          targetDivision!.players,
        );
        return <GameHistoryDisplay games={recentGamesSmall} side="player1" />;

      case "tournament-info":
        return (
          <div>
            {tournamentData?.tournament.name || "N/A"}
            {" | "}
            {tournamentData?.tournament.lexicon || "N/A"}
            {" | "}
            Division {targetDivision?.division.name || "N/A"}
          </div>
        );

      default:
        return <div>Unknown source: {source}</div>;
    }
  };

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
              Player {playerIdParam || playerNameParam} not found in division{" "}
              {divisionName}
            </div>
          );
        }

        if (tournamentData && targetDivision) {
          return (
            <div className="inline-block text-black">
              {renderPlayerData(source, targetPlayer)}
            </div>
          );
        }

        return <div className="text-black p-2">Loading...</div>;
      })()}
    </LoadingErrorWrapper>
  );
};

export default PlayerOverlay;
