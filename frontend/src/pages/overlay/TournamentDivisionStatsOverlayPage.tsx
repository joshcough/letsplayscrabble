import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import { TournamentDivisionStatsDisplay } from "../../components/shared/TournamentDivisionStatsDisplay";
import { calculateDivisionStats } from "../../utils/tournamentStatsCalculators";

const TournamentDivisionStatsOverlayPage: React.FC = () => {
  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

  const statsCalculator = React.useCallback((standings: PlayerStats[]) => {
    // This component doesn't actually modify standings, just calculates stats
    return standings;
  }, []);

  const { standings, tournament, loading, fetchError } = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    rankCalculator: statsCalculator
  });

  const stats = React.useMemo(() => {
    if (!standings || !tournament || currentMatch?.division_id === undefined) return null;
    return calculateDivisionStats(standings, tournament, currentMatch.division_id);
  }, [standings, tournament, currentMatch?.division_id]);

  return (
    <LoadingErrorWrapper
      loading={matchLoading || loading}
      error={matchError || fetchError}
    >
      {currentMatch && stats && tournament ? (
        <TournamentDivisionStatsDisplay
          tournament={tournament}
          divisionName={tournament.divisions[currentMatch.division_id].name}
          stats={stats}
        />
      ) : (
        <div className="text-black p-2">No current match or tournament data</div>
      )}
    </LoadingErrorWrapper>
  );
};

export default TournamentDivisionStatsOverlayPage;