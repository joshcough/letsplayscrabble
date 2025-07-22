import React from 'react';
import { useParams } from 'react-router-dom';
import { PlayerStats, ProcessedTournament } from '@shared/types/tournament';
import { useCurrentMatch } from '../../hooks/useCurrentMatch';
import { useTournamentData } from '../../hooks/useTournamentData';
import { useTournamentDataFromParams } from '../../hooks/useTournamentDataFromParams';
import { LoadingErrorWrapper } from './LoadingErrorWrapper';

interface BaseOverlayDataProps {
  tournament: ProcessedTournament;
  standings: PlayerStats[];
  divisionName: string;
}

interface BaseOverlayProps {
  rankCalculator: (players: PlayerStats[]) => PlayerStats[];
  children: (props: BaseOverlayDataProps) => React.ReactNode;
}

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

export const BaseOverlay: React.FC<BaseOverlayProps> = ({
  rankCalculator,
  children
}) => {
  const { tournamentId, divisionName } = useParams<RouteParams>();
  const shouldUseCurrentMatch = !tournamentId || !divisionName;

  // Current match approach
  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();
  const currentMatchData = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    rankCalculator
  });

  // URL params approach (already handles useGamesAdded internally)
  const urlParamsData = useTournamentDataFromParams(rankCalculator);

  // Choose which data to use
  let standings, tournament, loading, fetchError, finalDivisionName;

  if (shouldUseCurrentMatch) {
    standings = currentMatchData.standings;
    tournament = currentMatchData.tournament;
    loading = matchLoading || currentMatchData.loading;
    fetchError = matchError || currentMatchData.fetchError;
    finalDivisionName = currentMatch?.division_id !== undefined && tournament ?
      tournament.divisions[currentMatch.division_id].name : undefined;
  } else {
    standings = urlParamsData.standings;
    tournament = urlParamsData.tournament;
    loading = urlParamsData.loading;
    fetchError = urlParamsData.fetchError;
    finalDivisionName = urlParamsData.divisionName;
  }

  // Check if we have complete data
  const hasCompleteData = standings && tournament && finalDivisionName;

  // Only show loading if we don't have data AND we're actually loading
  const shouldShowLoading = !hasCompleteData && loading;

  return (
    <LoadingErrorWrapper
      loading={shouldShowLoading}
      error={fetchError}
    >
      {hasCompleteData ? (
        children({
          tournament: tournament!,
          standings: standings!,
          divisionName: finalDivisionName!
        })
      ) : (
        shouldShowLoading && <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};