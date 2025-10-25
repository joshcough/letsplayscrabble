import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

import * as Domain from "@shared/types/domain";
import { GamesAddedMessage } from "@shared/types/websocket";

import { ApiService } from "../services/interfaces";
import {
  SubscribeMessage,
  TournamentDataResponse,
  TournamentDataRefresh,
  TournamentDataIncremental,
  TournamentDataError,
  DivisionScopedData,
} from "../types/broadcast";
import BroadcastManager from "./BroadcastManager";

interface UseTournamentDataProps {
  tournamentId?: number;
  divisionId?: number;
  useUrlParams?: boolean;
  apiService: ApiService;
}

type RouteParams = {
  [key: string]: string | undefined;
  userId: string;
  tournamentId?: string;
  divisionName?: string;
};

export const useTournamentData = ({
  tournamentId: propTournamentId,
  divisionId: propDivisionId,
  useUrlParams = false,
  apiService,
}: UseTournamentDataProps) => {
  const {
    userId,
    tournamentId: urlTournamentId,
    divisionName,
  } = useParams<RouteParams>();

  // Changed: Now storing division-scoped data instead of full tournament
  const [divisionScopedData, setDivisionScopedData] =
    useState<DivisionScopedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const shouldUseUrlParams = useUrlParams && urlTournamentId && divisionName;
  const effectiveTournamentId = shouldUseUrlParams
    ? Number(urlTournamentId)
    : propTournamentId;

  // Create broadcast channel instance for sending SUBSCRIBE messages - use ref to prevent recreation on re-renders
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize broadcast channel once
  if (!broadcastChannelRef.current) {
    broadcastChannelRef.current = new BroadcastChannel("tournament-updates");
  }

  const subscribeToTournamentData = () => {
    if (!userId || !effectiveTournamentId) {
      setFetchError("Missing required parameters");
      return;
    }

    // Must have either divisionId or divisionName
    if (!propDivisionId && !divisionName) {
      setFetchError("Missing division identifier (need divisionId or divisionName)");
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const subscribeMessage: SubscribeMessage = {
        userId: parseInt(userId),
        tournamentId: effectiveTournamentId,
        divisionId: propDivisionId, // Set if provided (from currentMatch)
        divisionName: divisionName, // Set if from URL params
      };

      console.log(
        `📤 useTournamentData sending SUBSCRIBE message:`,
        subscribeMessage,
      );

      broadcastChannelRef.current?.postMessage({
        type: "SUBSCRIBE",
        data: subscribeMessage,
      });
    } catch (err) {
      setFetchError(
        err instanceof Error
          ? err.message
          : "Failed to subscribe to tournament data",
      );
      setLoading(false);
    }
  };

  // Initial data subscription on mount
  useEffect(() => {
    if (userId && effectiveTournamentId) {
      if (shouldUseUrlParams || propTournamentId) {
        console.log(
          `🔔 useTournamentData subscribing to tournament data on mount`,
        );
        subscribeToTournamentData();
      }
    }
  }, [
    userId,
    effectiveTournamentId,
    propDivisionId,
    divisionName,
    shouldUseUrlParams,
  ]);

  // Listen for GamesAdded broadcasts and re-subscribe (for compatibility)
  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupGamesAdded = BroadcastManager.getInstance().onGamesAdded(
      (data: GamesAddedMessage) => {
        console.log(
          "🎮 useTournamentData received GamesAdded broadcast:",
          data,
        );
        if (
          data.userId === parseInt(userId) &&
          data.tournamentId === effectiveTournamentId
        ) {
          console.log(
            "✅ Matching tournament - re-subscribing for fresh data!",
          );
          subscribeToTournamentData();
        } else {
          console.log("⏭️ Different tournament - ignoring");
        }
      },
    );

    return () => {
      cleanupGamesAdded();
    };
  }, [userId, effectiveTournamentId]);

  // Listen for AdminPanelUpdate broadcasts and re-subscribe when tournament/division changes
  useEffect(() => {
    if (!userId) return;

    const cleanupAdminPanelUpdate =
      BroadcastManager.getInstance().onAdminPanelUpdate((data) => {
        console.log(
          "🎮 useTournamentData received AdminPanelUpdate broadcast:",
          data,
        );

        // Only process if this update is for our user
        if (data.userId === parseInt(userId)) {
          console.log(
            "✅ AdminPanelUpdate for our user - checking if we need to resubscribe",
          );

          // Check if the tournament or division has changed from what we currently have
          const newTournamentId = data.tournamentId;
          const newDivisionId = data.divisionId;

          // If we're using URL params, compare against URL values
          // If we're using props, compare against prop values
          const currentTournamentId = effectiveTournamentId;
          const currentDivisionId = propDivisionId;

          if (
            newTournamentId !== currentTournamentId ||
            (propDivisionId && newDivisionId !== currentDivisionId)
          ) {
            console.log(
              `🔄 Tournament/division changed: ${currentTournamentId}/${currentDivisionId} → ${newTournamentId}/${newDivisionId} - resubscribing`,
            );

            // Note: The currentMatch will be updated by useCurrentMatch hook,
            // which will trigger our main subscription effect to resubscribe
            // We don't need to manually subscribe here
          } else {
            console.log(
              "⏭️ Same tournament/division - no resubscription needed",
            );
          }
        } else {
          console.log("⏭️ AdminPanelUpdate for different user - ignoring");
        }
      });

    return () => {
      cleanupAdminPanelUpdate();
    };
  }, [userId, effectiveTournamentId, propDivisionId]);

  // Listen for TOURNAMENT_DATA_RESPONSE broadcasts from worker (SUBSCRIBE responses)
  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupTournamentDataResponse =
      BroadcastManager.getInstance().onTournamentDataResponse(
        (data: TournamentDataResponse) => {
          console.log(
            "🎮 useTournamentData received TOURNAMENT_DATA_RESPONSE broadcast:",
            data,
          );

          // Filter by userId, tournamentId, and optionally divisionId
          const matchesUser = data.userId === parseInt(userId);
          const matchesTournament = data.tournamentId === effectiveTournamentId;
          const matchesDivision = !propDivisionId || data.divisionId === propDivisionId;

          if (matchesUser && matchesTournament && matchesDivision) {
            console.log(
              `✅ TOURNAMENT_DATA_RESPONSE for division ${data.data.division.name} (id: ${data.divisionId}) - accepting`,
            );

            // Division-scoped data arrives ready to use!
            setDivisionScopedData(data.data);
            setFetchError(null);
            setLoading(false);
          } else {
            console.log(
              `⏭️ Different tournament/user/division - ignoring (received: ${data.userId}/${data.tournamentId}/${data.divisionId}, expected: ${userId}/${effectiveTournamentId}/${propDivisionId || 'any'})`,
            );
          }
        },
      );

    return () => {
      cleanupTournamentDataResponse();
    };
  }, [
    userId,
    effectiveTournamentId,
    propDivisionId,
  ]);

  // Listen for TOURNAMENT_DATA_REFRESH broadcasts from worker (AdminPanelUpdate responses)
  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupTournamentDataRefresh =
      BroadcastManager.getInstance().onTournamentDataRefresh(
        (data: TournamentDataRefresh) => {
          console.log(
            "🎮 useTournamentData received TOURNAMENT_DATA_REFRESH broadcast:",
            data,
          );

          // Filter by userId, tournamentId, and optionally divisionId
          const matchesUser = data.userId === parseInt(userId);
          const matchesTournament = data.tournamentId === effectiveTournamentId;
          const matchesDivision = !propDivisionId || data.divisionId === propDivisionId;

          if (matchesUser && matchesTournament && matchesDivision) {
            console.log(
              `✅ TOURNAMENT_DATA_REFRESH for division ${data.data.division.name} (id: ${data.divisionId}) - accepting`,
            );

            // Division-scoped data arrives ready to use!
            setDivisionScopedData(data.data);
            setFetchError(null);
            setLoading(false);
          } else {
            console.log(
              `⏭️ Different tournament/user/division - ignoring (received: ${data.userId}/${data.tournamentId}/${data.divisionId}, expected: ${userId}/${effectiveTournamentId}/${propDivisionId || 'any'})`,
            );
          }
        },
      );

    return () => {
      cleanupTournamentDataRefresh();
    };
  }, [
    userId,
    effectiveTournamentId,
    propDivisionId,
  ]);

  // Listen for TOURNAMENT_DATA_INCREMENTAL broadcasts from worker (GamesAdded responses)
  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupTournamentDataIncremental =
      BroadcastManager.getInstance().onTournamentDataIncremental(
        (data: TournamentDataIncremental) => {
          console.log(
            "🎮 useTournamentData received TOURNAMENT_DATA_INCREMENTAL broadcast:",
            data,
          );

          // Filter by userId, tournamentId, and optionally divisionId
          const matchesUser = data.userId === parseInt(userId);
          const matchesTournament = data.tournamentId === effectiveTournamentId;
          const matchesDivision = !propDivisionId || data.divisionId === propDivisionId;

          if (matchesUser && matchesTournament && matchesDivision) {
            console.log(
              `✅ TOURNAMENT_DATA_INCREMENTAL for division ${data.data.division.name} - applying ${data.metadata.addedCount} added, ${data.metadata.updatedCount} updated games`,
            );

            // Division-scoped data arrives ready to use!
            setDivisionScopedData(data.data);
            setFetchError(null);
            setLoading(false);
          } else {
            console.log(
              `⏭️ Different tournament/user/division - ignoring (received: ${data.userId}/${data.tournamentId}/${data.divisionId}, expected: ${userId}/${effectiveTournamentId}/${propDivisionId || 'any'})`,
            );
          }
        },
      );

    return () => {
      cleanupTournamentDataIncremental();
    };
  }, [
    userId,
    effectiveTournamentId,
    propDivisionId,
  ]);

  // Listen for TOURNAMENT_DATA_ERROR broadcasts from worker
  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupTournamentDataError =
      BroadcastManager.getInstance().onTournamentDataError(
        (data: TournamentDataError) => {
          console.log(
            "🔴 useTournamentData received TOURNAMENT_DATA_ERROR broadcast:",
            data,
          );

          // Filter by userId and tournamentId
          if (
            data.userId === parseInt(userId) &&
            data.tournamentId === effectiveTournamentId
          ) {
            console.log("❌ Tournament data error for our tournament");
            setFetchError(data.error);
            setLoading(false);
          } else {
            console.log(
              `⏭️ Error for different tournament/user - ignoring (received: ${data.userId}/${data.tournamentId}, expected: ${userId}/${effectiveTournamentId})`,
            );
          }
        },
      );

    return () => {
      cleanupTournamentDataError();
    };
  }, [userId, effectiveTournamentId]);

  // Cleanup broadcast channel on unmount
  useEffect(() => {
    return () => {
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  // Return division-scoped data with backward-compatible interface
  return {
    tournamentData: divisionScopedData, // Now DivisionScopedData instead of full Tournament
    selectedDivisionId: divisionScopedData?.division.id || null,
    divisionName: divisionScopedData?.division.name,
    loading,
    fetchError,
    refetch: subscribeToTournamentData,
  };
};
