import { useState, useEffect } from "react";
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
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial current match data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const match = await fetchCurrentMatch();
      setCurrentMatch(match);
    } catch (err) {
      console.error("Error fetching current match:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch current match");
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time updates via broadcast channel
  useEffect(() => {
    const displayManager = DisplaySourceManager.getInstance();

    const cleanup = displayManager.onAdminPanelUpdate((updatedMatch: CurrentMatch) => {
      console.log("📥 useCurrentMatch received AdminPanelUpdate:", updatedMatch);
      setCurrentMatch(updatedMatch);
      setError(null); // Clear any previous errors when we get fresh data
    });

    return cleanup;
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    fetchData();
  }, []);

  return {
    currentMatch,
    loading,
    error,
    refetch: fetchData,
  };
};