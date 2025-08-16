import React from "react";
import { useParams, useSearchParams } from "react-router-dom";


import { BaseOverlay } from "../../components/shared/BaseOverlay";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import { useTournamentData } from "../../hooks/useTournamentData";
import {
  calculateTournamentStats,
  calculateAllTournamentStats,
  TournamentStats,
} from "../../utils/calculateStandings";

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
};

const TournamentStatsOverlayPage: React.FC = () => {
  const { userId, tournamentId, divisionName } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const showAllDivisions = searchParams.get("all_divisions") === "true";

  // Determine what data to calculate stats from
  const shouldUseCurrentMatch = !tournamentId;
  const hasDivisionSpecified = divisionName !== undefined;

  // If we're using current match, use BaseOverlay, otherwise use direct useTournamentData
  if (shouldUseCurrentMatch) {
    return (
      <BaseOverlay>
        {({
          tournament,
          divisionData,
          divisionName: currentDivisionName,
          currentMatch,
        }) => {
          // Calculate stats for current division
          const stats = calculateTournamentStats(
            divisionData.games,
            divisionData.players,
          );
          const title = `${tournament.name} Div ${currentDivisionName} - Total Tournament Stats`;
          return (
            <StatsDisplay
              stats={stats}
              title={title}
              tournamentName={tournament.name}
            />
          );
        }}
      </BaseOverlay>
    );
  } else {
    // URL-based approach (no current match dependency)
    return (
      <URLBasedStatsDisplay
        tournamentId={Number(tournamentId)}
        divisionName={divisionName}
      />
    );
  }
};

// Component for URL-based stats (no current match)
const URLBasedStatsDisplay: React.FC<{
  tournamentId: number;
  divisionName?: string;
}> = ({ tournamentId, divisionName }) => {
  const {
    tournamentData,
    getDivisionData,
    loading: dataLoading,
    fetchError,
  } = useTournamentData({
    tournamentId: tournamentId,
    useUrlParams: false,
  });

  // Calculate stats based on whether we have a specific division or all divisions
  const stats = React.useMemo((): TournamentStats | null => {
    if (!tournamentData) {
      return null;
    }

    if (!divisionName) {
      // No division specified - calculate across all divisions
      return calculateAllTournamentStats(tournamentData);
    }

    // Use URL-specified division
    const targetDivision = tournamentData.divisions.find(
      (div) => div.name.toUpperCase() === divisionName.toUpperCase(),
    );
    return targetDivision
      ? calculateTournamentStats(targetDivision.games, targetDivision.players)
      : null;
  }, [tournamentData, divisionName]);

  // Create title
  const title = divisionName
    ? `${tournamentData?.name || "Tournament"} Div ${divisionName} - Total Tournament Stats`
    : `${tournamentData?.name || "Tournament"} - Total Tournament Stats`;

  // Validation for URL-based division access
  if (divisionName && tournamentData) {
    const divisionExists = tournamentData.divisions.some(
      (div) => div.name.toUpperCase() === divisionName.toUpperCase(),
    );
    if (!divisionExists) {
      return (
        <LoadingErrorWrapper
          loading={false}
          error={`Division "${divisionName}" not found in this tournament`}
        >
          <div />
        </LoadingErrorWrapper>
      );
    }
  }

  return (
    <LoadingErrorWrapper loading={dataLoading} error={fetchError}>
      {stats && tournamentData ? (
        <StatsDisplay
          stats={stats}
          title={title}
          tournamentName={tournamentData.name}
        />
      ) : (
        <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};

// Shared component for displaying stats
const StatsDisplay: React.FC<{
  stats: TournamentStats;
  title: string;
  tournamentName: string;
}> = ({ stats, title }) => {
  // StatItem component for displaying individual stats
  const StatItem: React.FC<{ label: string; value: string | number }> = ({
    label,
    value,
  }) => {
    return (
      <div className="flex flex-col items-center">
        <div className="text-black text-lg font-bold mb-2">{label}</div>
        <div className="text-4xl font-bold text-black text-center">{value}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-4xl font-bold text-center mb-8">
        {title}
      </div>

      <div className="flex justify-center gap-8 max-w-6xl overflow-x-auto">
        <StatItem label="Games Played" value={stats.gamesPlayed} />
        <StatItem
          label="Points Scored"
          value={stats.pointsScored.toLocaleString()}
        />
        <StatItem label="Average Score" value={stats.averageScore} />
        <StatItem
          label="Higher Rated Win%"
          value={`${stats.higherRatedWinPercent.toFixed(1)}%`}
        />
        <StatItem
          label="Going First Win%"
          value={`${stats.goingFirstWinPercent.toFixed(1)}%`}
        />
      </div>
    </div>
  );
};

export default TournamentStatsOverlayPage;
