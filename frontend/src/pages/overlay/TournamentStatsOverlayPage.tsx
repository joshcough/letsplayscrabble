import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Tournament } from "@shared/types/database";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import { calculateTournamentStats, calculateAllTournamentStats, TournamentStats } from "../../utils/calculateStandings";

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

  // Determine what data to calculate stats from
  const shouldUseCurrentMatch = !tournamentId;
  const hasDivisionSpecified = divisionName || (shouldUseCurrentMatch && currentMatch?.division_id !== undefined);

  // Determine tournament and division IDs for useTournamentData
  const finalTournamentId = shouldUseCurrentMatch ? currentMatch?.tournament_id : Number(tournamentId);

  let finalDivisionId: number | undefined = undefined;
  if (hasDivisionSpecified && shouldUseCurrentMatch) {
    finalDivisionId = currentMatch?.division_id;
  }

  // Use the unified hook for all data fetching
  const {
    tournamentData,
    getDivisionData,
    loading: dataLoading,
    fetchError
  } = useTournamentData({
    tournamentId: finalTournamentId,
    divisionId: hasDivisionSpecified ? finalDivisionId : undefined,
  });

  // Calculate stats based on whether we have a specific division or all divisions
  const stats = React.useMemo((): TournamentStats | null => {
    if (!tournamentData) return null;

    if (!hasDivisionSpecified) {
      // No division specified - calculate across all divisions
      return calculateAllTournamentStats(tournamentData);
    }

    if (shouldUseCurrentMatch) {
      // Use current match division
      const divisionData = getDivisionData(currentMatch?.division_id);
      return divisionData ? calculateTournamentStats(divisionData.games, divisionData.players) : null;
    }

    // Use URL-specified division
    if (!divisionName) return null;
    const targetDivision = tournamentData.divisions.find(
      div => div.division.name.toUpperCase() === divisionName.toUpperCase()
    );
    return targetDivision ? calculateTournamentStats(targetDivision.games, targetDivision.players) : null;
  }, [tournamentData, hasDivisionSpecified, shouldUseCurrentMatch, currentMatch?.division_id, divisionName, getDivisionData]);

  // Determine division name for display (undefined = tournament-wide)
  const finalDivisionName = React.useMemo(() => {
    if (!hasDivisionSpecified) return undefined;
    if (shouldUseCurrentMatch && currentMatch?.division_id && tournamentData) {
      return tournamentData.divisions.find(div => div.division.id === currentMatch.division_id)?.division.name;
    }
    return divisionName;
  }, [hasDivisionSpecified, shouldUseCurrentMatch, currentMatch?.division_id, tournamentData, divisionName]);

  const loading = matchLoading || dataLoading;
  const error = matchError || fetchError;

  // Create title
  const title = finalDivisionName
    ? `${tournamentData?.tournament?.name || 'Tournament'} Div ${finalDivisionName} - Total Tournament Stats`
    : `${tournamentData?.tournament?.name || 'Tournament'} - Total Tournament Stats`;

  // StatItem component for displaying individual stats
  const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
    return (
      <div className="flex flex-col items-center">
        <div className="text-black text-lg font-bold mb-2">{label}</div>
        <div className="text-4xl font-bold text-black text-center">{value}</div>
      </div>
    );
  };

  // Validation for URL-based division access
  if (!shouldUseCurrentMatch && hasDivisionSpecified && divisionName && tournamentData) {
    const divisionExists = tournamentData.divisions.some(
      div => div.division.name.toUpperCase() === divisionName.toUpperCase()
    );
    if (!divisionExists) {
      return (
        <LoadingErrorWrapper loading={false} error={`Division "${divisionName}" not found in this tournament`}>
          <div />
        </LoadingErrorWrapper>
      );
    }
  }

  return (
    <LoadingErrorWrapper loading={loading} error={error}>
      {stats && tournamentData ? (
        <div className="flex flex-col items-center pt-8 font-bold">
          <div className="text-black text-4xl font-bold text-center mb-8">
            {title}
          </div>

          <div className="flex justify-center gap-8 max-w-6xl overflow-x-auto">
            <StatItem label="Games Played" value={stats.gamesPlayed} />
            <StatItem label="Points Scored" value={stats.pointsScored.toLocaleString()} />
            <StatItem label="Average Score" value={stats.averageScore} />
            <StatItem label="Higher Rated Win%" value={`${stats.higherRatedWinPercent.toFixed(1)}%`} />
            <StatItem label="Going First Win%" value={`${stats.goingFirstWinPercent.toFixed(1)}%`} />
          </div>
        </div>
      ) : (
        <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};

export default TournamentStatsOverlayPage;