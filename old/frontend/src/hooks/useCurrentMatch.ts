import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import * as Domain from "@shared/types/domain";
import { AdminPanelUpdateMessage } from "@shared/types/websocket";

import { ApiService } from "../services/interfaces";
import BroadcastManager from "./BroadcastManager";

interface UseCurrentMatchReturn {
  currentMatch: Domain.CurrentMatch | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that provides current match state with real-time updates
 * Perfect for most components that just need the basic current match info
 */
export const useCurrentMatch = (
  apiService: ApiService,
): UseCurrentMatchReturn => {
  const { userId } = useParams<{ userId: string }>();
  const [currentMatch, setCurrentMatch] = useState<Domain.CurrentMatch | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial current match data
  const fetchData = async () => {
    if (!userId) {
      setError("User ID not found in URL");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCurrentMatch(parseInt(userId));
      const match = response.success ? response.data : null;
      setCurrentMatch(match);
    } catch (err) {
      console.error("Error fetching current match:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch current match",
      );
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time updates via broadcast channel
  useEffect(() => {
    if (!userId) return;

    const broadcastManager = BroadcastManager.getInstance();

    broadcastManager.onPing((pingData) => {
      console.log(`Overlay received ping!`, pingData);
    });

    const cleanup = broadcastManager.onAdminPanelUpdate((data: AdminPanelUpdateMessage) => {
      console.log("📥 useCurrentMatch received AdminPanelUpdate:", data);
      // Only process if this update is for our user
      if (data.userId === parseInt(userId)) {
        const currentMatchData: Domain.CurrentMatch = {
          tournamentId: data.tournamentId,
          divisionId: data.divisionId,
          divisionName: data.divisionName,
          round: data.round,
          pairingId: data.pairingId,
          updatedAt: new Date(),
        };
        setCurrentMatch(currentMatchData);
        setError(null); // Clear any previous errors when we get fresh data
      } else {
        console.log("❌ AdminPanelUpdate is for different user, ignoring");
      }
    });

    return cleanup;
  }, [userId]);

  // Fetch initial data when userId is available
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  return {
    currentMatch,
    loading,
    error,
    refetch: fetchData,
  };
};
