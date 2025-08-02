import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import * as DB from "@shared/types/database";
import {
  GamesAddedMessage,
  TournamentDataMessage,
  SubscribeMessage,
} from "@shared/types/websocket";

import { fetchTournament, fetchTournamentDivision } from "../utils/api";
import BroadcastManager from "./BroadcastManager";

interface UseTournamentDataProps {
  tournamentId?: number;
  divisionId?: number;
  useUrlParams?: boolean;
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
}: UseTournamentDataProps) => {
  const {
    userId,
    tournamentId: urlTournamentId,
    divisionName,
  } = useParams<RouteParams>();

  const [tournamentData, setTournamentData] = useState<DB.Tournament | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
    null,
  );

  const shouldUseUrlParams = useUrlParams && urlTournamentId && divisionName;
  const effectiveTournamentId = shouldUseUrlParams
    ? Number(urlTournamentId)
    : propTournamentId;

  // Create broadcast channel instance for sending SUBSCRIBE messages
  const broadcastChannel = new BroadcastChannel("tournament-updates");

  const subscribeToTournamentData = () => {
    if (!userId || !effectiveTournamentId) {
      setFetchError("Missing required parameters");
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const subscribeMessage: SubscribeMessage = {
        userId: parseInt(userId),
        tournamentId: effectiveTournamentId,
        divisionId: propDivisionId, // Only set if we want a specific division
      };

      console.log(
        `📤 useTournamentData sending SUBSCRIBE message:`,
        subscribeMessage,
      );

      broadcastChannel.postMessage({
        type: 'SUBSCRIBE',
        data: subscribeMessage,
      });

    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to subscribe to tournament data",
      );
      setLoading(false);
    }
  };

  // Fallback direct fetch method (for emergencies or if worker isn't available)
  const fetchTournamentData = async () => {
    if (!userId || !effectiveTournamentId) {
      setFetchError("Missing required parameters");
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      let tournament: DB.Tournament;
      let finalDivisionId: number | null = null;

      if (shouldUseUrlParams) {
        tournament = await fetchTournament(
          parseInt(userId),
          effectiveTournamentId,
        );
      } else if (propDivisionId) {
        tournament = await fetchTournamentDivision(
          parseInt(userId),
          effectiveTournamentId,
          propDivisionId,
        );
        finalDivisionId = propDivisionId;
      } else {
        tournament = await fetchTournament(
          parseInt(userId),
          effectiveTournamentId,
        );
      }

      if (shouldUseUrlParams && divisionName) {
        const divisionData = tournament.divisions.find(
          (d) => d.division.name.toUpperCase() === divisionName.toUpperCase(),
        );
        if (!divisionData) {
          throw new Error(`Division "${divisionName}" not found`);
        }
        finalDivisionId = divisionData.division.id;
      }

      setTournamentData(tournament);
      setSelectedDivisionId(finalDivisionId);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to fetch tournament data",
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial data subscription on mount
  useEffect(() => {
    if (userId && effectiveTournamentId) {
      if (shouldUseUrlParams || propTournamentId) {
        console.log(`🔔 useTournamentData subscribing to tournament data on mount`);
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
          data.update.tournament.user_id === parseInt(userId) &&
          data.update.tournament.id === effectiveTournamentId
        ) {
          console.log("✅ Matching tournament - re-subscribing for fresh data!");
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

  // Listen for TOURNAMENT_DATA broadcasts from worker
  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupTournamentData =
      BroadcastManager.getInstance().onTournamentData(
        (data: TournamentDataMessage) => {
          console.log(
            "🎮 useTournamentData received TOURNAMENT_DATA broadcast:",
            data,
          );
          if (
            data.userId === parseInt(userId) &&
            data.tournamentId === effectiveTournamentId
          ) {
            console.log(
              "✅ Using worker's tournament data - no API call needed!",
            );

            // Process the tournament data (same logic as fetchTournamentData)
            const tournament = data.data;
            let finalDivisionId: number | null = null;

            if (propDivisionId) {
              finalDivisionId = propDivisionId;
            } else if (shouldUseUrlParams && divisionName) {
              const divisionData = tournament.divisions.find(
                (d) =>
                  d.division.name.toUpperCase() === divisionName.toUpperCase(),
              );
              if (divisionData) {
                finalDivisionId = divisionData.division.id;
              }
            }

            setTournamentData(tournament);
            setSelectedDivisionId(finalDivisionId);
            setFetchError(null);
            setLoading(false);
          } else {
            console.log("⏭️ Different tournament - ignoring");
          }
        },
      );

    return () => {
      cleanupTournamentData();
    };
  }, [
    userId,
    effectiveTournamentId,
    propDivisionId,
    divisionName,
    shouldUseUrlParams,
  ]);

  // Listen for TOURNAMENT_DATA_ERROR broadcasts from worker
  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupTournamentDataError =
      BroadcastManager.getInstance().onTournamentDataError(
        (data) => {
          console.log(
            "🔴 useTournamentData received TOURNAMENT_DATA_ERROR broadcast:",
            data,
          );
          if (
            data.userId === parseInt(userId) &&
            data.tournamentId === effectiveTournamentId
          ) {
            console.log("❌ Tournament data error for our tournament");
            setFetchError(data.error);
            setLoading(false);
          }
        },
      );

    return () => {
      cleanupTournamentDataError();
    };
  }, [userId, effectiveTournamentId]);

  const getDivisionData = (divisionId?: number) => {
    if (!tournamentData) return null;
    const targetDivisionId = divisionId || selectedDivisionId;
    if (!targetDivisionId) return null;
    return (
      tournamentData.divisions.find(
        (d) => d.division.id === targetDivisionId,
      ) || null
    );
  };

  const getDivisionName = (divisionId?: number) => {
    const divisionData = getDivisionData(divisionId);
    return (
      divisionData?.division.name ||
      (shouldUseUrlParams ? divisionName : undefined)
    );
  };

  // Cleanup broadcast channel on unmount
  useEffect(() => {
    return () => {
      broadcastChannel.close();
    };
  }, []);

  return {
    tournamentData,
    getDivisionData,
    selectedDivisionId,
    divisionName: getDivisionName(),
    loading,
    fetchError,
    refetch: subscribeToTournamentData, // Changed from fetchTournamentData to subscribeToTournamentData
    refetchDirect: fetchTournamentData, // Backup direct fetch method
  };
};