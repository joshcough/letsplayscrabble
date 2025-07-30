import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CurrentMatch } from "@shared/types/currentMatch";
import DisplaySourceManager from "./DisplaySourceManager";
import { fetchCurrentMatch } from "../utils/matchApi";

interface UseCurrentMatchReturn {
  currentMatch: CurrentMatch | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that provides current match state with real-time updates
 * Perfect for most components that just need the basic current match info
 */
export const useCurrentMatch = (): UseCurrentMatchReturn => {
  const { userId } = useParams<{ userId: string }>();
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);
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
      const match = await fetchCurrentMatch(parseInt(userId));
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

    const displayManager = DisplaySourceManager.getInstance();

    const cleanup = displayManager.onAdminPanelUpdate((data: any) => {
      console.log("📥 useCurrentMatch received AdminPanelUpdate:", data);
      // Only process if this update is for our user
      if (data.userId === parseInt(userId)) {
        const { userId: _, ...matchData } = data;
        setCurrentMatch(matchData as CurrentMatch);
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
