import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { BaseOverlay } from "../../components/shared/BaseOverlay";
import { ThemeProvider } from "../../components/shared/ThemeProvider";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import { useTournamentData } from "../../hooks/useTournamentData";
import { ApiService } from "../../services/interfaces";
import { Theme } from "../../types/theme";
import {
  calculateTournamentStats,
  calculateAllTournamentStats,
  TournamentStats,
} from "../../utils/calculateStandings";
import { getThemeClasses } from "../../utils/themeUtils";

type RouteParams = {
  userId?: string;
  tournamentId?: string;
  divisionName?: string;
};

const TournamentStatsOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { userId, tournamentId, divisionName } = useParams<RouteParams>();
  const [searchParams] = useSearchParams();
  const showAllDivisions = searchParams.get("all_divisions") === "true";

  // Determine what data to calculate stats from
  const shouldUseCurrentMatch = !tournamentId;
  const hasDivisionSpecified = divisionName !== undefined;

  // If we're using current match, use BaseOverlay, otherwise use direct useTournamentData
  if (shouldUseCurrentMatch) {
    return (
      <ThemeProvider>
        {(theme, themeClasses) => (
          <BaseOverlay apiService={apiService}>
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
                  theme={theme}
                  themeClasses={themeClasses}
                />
              );
            }}
          </BaseOverlay>
        )}
      </ThemeProvider>
    );
  } else {
    // URL-based approach (no current match dependency)
    return (
      <ThemeProvider>
        {(theme, themeClasses) => (
          <URLBasedStatsDisplay
            tournamentId={Number(tournamentId)}
            divisionName={divisionName}
            apiService={apiService}
            theme={theme}
            themeClasses={themeClasses}
          />
        )}
      </ThemeProvider>
    );
  }
};

// Component for URL-based stats (no current match)
const URLBasedStatsDisplay: React.FC<{
  tournamentId: number;
  divisionName?: string;
  apiService: ApiService;
  theme: Theme;
  themeClasses: ReturnType<typeof getThemeClasses>;
}> = ({ tournamentId, divisionName, apiService, theme, themeClasses }) => {
  const {
    tournamentData,
    loading: dataLoading,
    fetchError,
  } = useTournamentData({
    tournamentId: tournamentId,
    useUrlParams: false,
    apiService,
  });

  // Calculate stats based on whether we have a specific division or all divisions
  const stats = React.useMemo((): TournamentStats | null => {
    if (!tournamentData) {
      return null;
    }

    // tournamentData is now division-scoped, so it only contains one division
    // Calculate stats for this division
    const targetDivision = tournamentData.division;
    return targetDivision
      ? calculateTournamentStats(targetDivision.games, targetDivision.players)
      : null;
  }, [tournamentData, divisionName]);

  // Create title
  const title = divisionName
    ? `${tournamentData?.tournament.name || "Tournament"} Div ${divisionName} - Total Tournament Stats`
    : `${tournamentData?.tournament.name || "Tournament"} - Total Tournament Stats`;

  // Validation for URL-based division access - now always has division if tournamentData exists
  if (divisionName && tournamentData) {
    const divisionExists = tournamentData.division.name.toUpperCase() === divisionName.toUpperCase();
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
          tournamentName={tournamentData.tournament.name}
          theme={theme}
          themeClasses={themeClasses}
        />
      ) : (
        <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
          <div className={theme.colors.textPrimary}>Loading...</div>
        </div>
      )}
    </LoadingErrorWrapper>
  );
};

// Shared component for displaying stats
const StatsDisplay: React.FC<{
  stats: TournamentStats;
  title: string;
  tournamentName: string;
  theme: Theme;
  themeClasses: ReturnType<typeof getThemeClasses>;
}> = ({ stats, title, theme, themeClasses }) => {
  // StatItem component for displaying individual stats
  const StatItem: React.FC<{ 
    label: string; 
    value: string | number;
    icon?: string;
    color?: string;
  }> = ({
    label,
    value,
    icon,
    color = "from-blue-400 to-purple-600"
  }) => {
    return (
      <div className={`${theme.colors.cardBackground} rounded-2xl p-6 border ${theme.colors.primaryBorder} shadow-xl min-w-[180px]`}>
        <div className="flex flex-col items-center">
          {icon && <div className="text-3xl mb-2">{icon}</div>}
          <div className={`${theme.colors.textAccent} text-lg font-bold uppercase tracking-wider mb-3`}>
            {label}
          </div>
          <div className={`text-5xl font-black ${theme.name === 'original' ? theme.colors.textPrimary : `text-transparent bg-clip-text bg-gradient-to-r ${color}`}`}>
            {value}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
      <div className="max-w-7xl w-full">
        <div className="text-center mb-10">
          <h1 className={`text-6xl font-black mb-3 ${theme.name === 'original' ? theme.colors.titleGradient : `text-transparent bg-clip-text bg-gradient-to-r ${theme.colors.titleGradient}`}`}>
            Tournament Statistics
          </h1>
          <div className={`text-3xl ${theme.colors.textSecondary}`}>
            {title}
          </div>
        </div>

        <div className="flex justify-center gap-6 flex-wrap">
          <StatItem 
            label="Games Played" 
            value={stats.gamesPlayed}
            icon="🎮"
            color="from-green-400 to-blue-500"
          />
          <StatItem
            label="Points Scored"
            value={stats.pointsScored.toLocaleString()}
            icon="💯"
            color="from-yellow-400 to-orange-500"
          />
          <StatItem 
            label="Average Score" 
            value={stats.averageScore}
            icon="📊"
            color="from-purple-400 to-pink-500"
          />
          <StatItem
            label="Higher Rated Win%"
            value={`${stats.higherRatedWinPercent.toFixed(1)}%`}
            icon="🏆"
            color="from-blue-400 to-cyan-500"
          />
          <StatItem
            label="Going First Win%"
            value={`${stats.goingFirstWinPercent.toFixed(1)}%`}
            icon="🥇"
            color="from-red-400 to-pink-500"
          />
        </div>
      </div>
    </div>
  );
};

export default TournamentStatsOverlayPage;