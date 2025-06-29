import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { useTournamentDataFromParams } from "../../hooks/useTournamentDataFromParams";
import { LoadingErrorWrapper } from "../shared/LoadingErrorWrapper";
import { TournamentDivisionStatsDisplay } from "../shared/TournamentDivisionStatsDisplay";
import { calculateDivisionStats } from "../../utils/tournamentStatsCalculators";

const TournamentDivisionStatsFromUrlOverlay: React.FC = () => {
  const statsCalculator = React.useCallback((standings: PlayerStats[]) => {
    // This component doesn't actually modify standings, just calculates stats
    return standings;
  }, []);

  const { standings, tournament, loading, fetchError, divisionName } = useTournamentDataFromParams(statsCalculator);

  const stats = React.useMemo(() => {
    if (!standings || !tournament) return null;

    // Find the division index from the division name
    const divisionIndex = tournament.divisions.findIndex(
      div => div.name.toUpperCase() === divisionName?.toUpperCase()
    );

    if (divisionIndex === -1) return null;

    return calculateDivisionStats(standings, tournament, divisionIndex);
  }, [standings, tournament, divisionName]);

  return (
    <LoadingErrorWrapper
      loading={loading}
      error={fetchError}
    >
      {stats && tournament && divisionName ? (
        <TournamentDivisionStatsDisplay
          tournament={tournament}
          divisionName={divisionName}
          stats={stats}
        />
      ) : (
        <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};

export default TournamentDivisionStatsFromUrlOverlay;