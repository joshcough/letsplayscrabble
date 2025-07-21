import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useGamesAdded } from "../../utils/socketHelpers";
import { fetchTournament } from "../../utils/tournamentApi";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import { TournamentDivisionStatsDisplay } from "../../components/shared/TournamentDivisionStatsDisplay";
import { calculateTournamentStats, calculateDivisionStats } from "../../utils/tournamentStatsCalculators";

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

const TournamentStatsOverlayPage: React.FC = () => {
  const { tournamentId, divisionName } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const showAllDivisions = searchParams.get("all_divisions") === "true";

  const { socket } = useSocketConnection();
  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

  // Determine what to show based on URL params and query params
  const shouldUseCurrentMatch = !tournamentId;
  const shouldShowAllDivisions = showAllDivisions || (!divisionName && tournamentId);

  // Current match data fetching
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

  const fetchTournamentData = async () => {
    if (!tournamentId) return;

    try {
      // Only show loading if we don't have data yet
      if (!urlTournament) {
        setUrlLoading(true);
      }
      setUrlFetchError(null);
      const tournamentData = await fetchTournament(Number(tournamentId));
      setUrlTournament(tournamentData);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setUrlFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setUrlLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  // Listen for games being added to URL-based tournament
  useGamesAdded(socket, (data: { tournamentId: number }) => {
    if (data.tournamentId === Number(tournamentId)) {
      fetchTournamentData();
    }
  });

  // Calculate stats based on the scenario
  const { stats, tournament: finalTournament, finalDivisionName, loading, error } = React.useMemo(() => {
    if (shouldUseCurrentMatch) {
      // Scenario 1: Current match data
      const { standings, tournament, loading, fetchError } = currentMatchData;

      if (showAllDivisions) {
        // Show all divisions for current tournament
        return {
          stats: tournament ? calculateTournamentStats(tournament) : null,
          tournament,
          finalDivisionName: undefined, // No division name = tournament-wide
          loading: matchLoading || loading,
          error: matchError || fetchError
        };
      } else {
        // Show current division only
        const stats = standings && tournament && currentMatch?.division_id !== undefined
          ? calculateDivisionStats(standings, tournament, currentMatch.division_id)
          : null;
        const finalDivisionName = currentMatch?.division_id !== undefined && tournament
          ? tournament.divisions[currentMatch.division_id].name
          : undefined;

        return {
          stats,
          tournament,
          finalDivisionName,
          loading: matchLoading || loading,
          error: matchError || fetchError
        };
      }
    } else {
      // Scenario 2 & 3: URL-based data
      if (shouldShowAllDivisions) {
        // Show all divisions for URL tournament
        return {
          stats: urlTournament ? calculateTournamentStats(urlTournament) : null,
          tournament: urlTournament,
          finalDivisionName: undefined,
          loading: urlLoading,
          error: urlFetchError
        };
      } else {
        // Show specific division from URL
        let stats = null;
        if (urlTournament && divisionName) {
          const divisionIndex = urlTournament.divisions.findIndex(
            div => div.name.toUpperCase() === divisionName.toUpperCase()
          );
          if (divisionIndex !== -1) {
            stats = calculateDivisionStats(urlTournament.standings[divisionIndex], urlTournament, divisionIndex);
          }
        }

        return {
          stats,
          tournament: urlTournament,
          finalDivisionName: divisionName,
          loading: urlLoading,
          error: urlFetchError
        };
      }
    }
  }, [
    shouldUseCurrentMatch,
    showAllDivisions,
    shouldShowAllDivisions,
    currentMatchData,
    currentMatch,
    matchLoading,
    matchError,
    urlTournament,
    urlLoading,
    urlFetchError,
    divisionName
  ]);

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