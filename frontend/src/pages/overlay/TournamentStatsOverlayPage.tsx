import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ProcessedTournament, PlayerStats, DivisionStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import DisplaySourceManager from "../../hooks/DisplaySourceManager";
import { fetchTournament, fetchDivisionStats, fetchTournamentStats } from "../../utils/tournamentApi";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import { TournamentDivisionStatsDisplay } from "../../components/shared/TournamentDivisionStatsDisplay";

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
};

const TournamentStatsOverlayPage: React.FC = () => {
  const { userId, tournamentId, divisionName } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const showAllDivisions = searchParams.get("all_divisions") === "true";

  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

  // Determine what to show based on URL params and query params
  const shouldUseCurrentMatch = !tournamentId;
  const shouldShowAllDivisions = showAllDivisions || (!divisionName && tournamentId);

  // Current match approach
  const statsCalculator = React.useCallback((standings: PlayerStats[]) => standings, []);
  const currentMatchData = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    rankCalculator: statsCalculator
  });

  // URL-based data fetching
  const [urlTournament, setUrlTournament] = useState<ProcessedTournament | null>(null);
  const [urlLoading, setUrlLoading] = useState<boolean>(false);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<DivisionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchTournamentData = async () => {
    if (!userId || !tournamentId) return;

    try {
      // Only show loading if we don't have data yet
      if (!urlTournament) {
        setUrlLoading(true);
      }
      setUrlFetchError(null);
      const tournamentData = await fetchTournament(parseInt(userId), Number(tournamentId));
      setUrlTournament(tournamentData);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setUrlFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setUrlLoading(false);
    }
  };

  useEffect(() => {
    if (userId && tournamentId) {
      fetchTournamentData();
    }
  }, [userId, tournamentId]);

  // Listen for games being added to URL-based tournament via broadcast channel
  useEffect(() => {
    if (!userId) return;

    const displayManager = DisplaySourceManager.getInstance();

    const cleanup = displayManager.onGamesAdded((data: any) => {
      console.log('📥 TournamentStatsOverlay received GamesAdded:', data);
      if (data.userId === parseInt(userId) && data.tournamentId === Number(tournamentId)) {
        fetchTournamentData();
      }
    });

    return cleanup;
  }, [userId, tournamentId]);

  // Fetch stats based on current scenario
  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setStatsError("User ID not found in URL");
        return;
      }

      setStatsError(null);

      if (shouldUseCurrentMatch) {
        // Scenario 1: Current match data
        if (!currentMatch?.tournament_id || currentMatch?.division_id === undefined) {
          setStats(null);
          return;
        }

        setStatsLoading(true);

        try {
          if (showAllDivisions) {
            const tournamentStats = await fetchTournamentStats(parseInt(userId), currentMatch.tournament_id);
            setStats(tournamentStats);
          } else {
            const divisionStats = await fetchDivisionStats(parseInt(userId), currentMatch.tournament_id, currentMatch.division_id);
            setStats(divisionStats);
          }
        } catch (error) {
          console.error('Error fetching current match stats:', error);
          setStatsError(error instanceof Error ? error.message : 'Failed to fetch stats');
        } finally {
          setStatsLoading(false);
        }
      } else {
        // Scenario 2 & 3: URL-based data
        if (!urlTournament) {
          setStats(null);
          return;
        }

        setStatsLoading(true);

        try {
          if (shouldShowAllDivisions) {
            const tournamentStats = await fetchTournamentStats(parseInt(userId), Number(tournamentId));
            setStats(tournamentStats);
          } else {
            if (!divisionName) {
              setStats(null);
              return;
            }

            // Find division index by name
            const divisionIndex = urlTournament.divisions.findIndex(
              div => div.name.toUpperCase() === divisionName.toUpperCase()
            );

            if (divisionIndex === -1) {
              setStatsError(`Division "${divisionName}" not found`);
              return;
            }

            const divisionStats = await fetchDivisionStats(parseInt(userId), Number(tournamentId), divisionIndex);
            setStats(divisionStats);
          }
        } catch (error) {
          console.error('Error fetching URL-based stats:', error);
          setStatsError(error instanceof Error ? error.message : 'Failed to fetch stats');
        } finally {
          setStatsLoading(false);
        }
      }
    };

    fetchStats();
  }, [
    userId,
    shouldUseCurrentMatch,
    showAllDivisions,
    shouldShowAllDivisions,
    currentMatch?.tournament_id,
    currentMatch?.division_id,
    urlTournament,
    tournamentId,
    divisionName
  ]);

  // Determine final values for rendering
  const finalTournament = shouldUseCurrentMatch ? currentMatchData.tournament : urlTournament;
  const finalDivisionName = shouldUseCurrentMatch
    ? (currentMatch?.division_id !== undefined && currentMatchData.tournament
        ? currentMatchData.tournament.divisions[currentMatch.division_id]?.name
        : undefined)
    : divisionName;

  const loading = matchLoading || currentMatchData.loading || urlLoading || statsLoading;
  const error = matchError || currentMatchData.fetchError || urlFetchError || statsError;

  // Check if we have complete data
  const hasCompleteData = stats && finalTournament;

  // Only show loading if we don't have data AND we're actually loading
  const shouldShowLoading = !hasCompleteData && loading;

  return (
    <LoadingErrorWrapper
      loading={shouldShowLoading}
      error={error}
    >
      {hasCompleteData ? (
        <TournamentDivisionStatsDisplay
          tournament={finalTournament}
          divisionName={finalDivisionName}
          stats={stats}
        />
      ) : (
        shouldShowLoading && <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};

export default TournamentStatsOverlayPage;