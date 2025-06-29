import React from 'react';
import { useParams } from 'react-router-dom';
import { PlayerStats } from '@shared/types/tournament';
import { useCurrentMatch } from '../../hooks/useCurrentMatch';
import { useTournamentData } from '../../hooks/useTournamentData';
import { useTournamentDataFromParams } from '../../hooks/useTournamentDataFromParams';
import { LoadingErrorWrapper } from './LoadingErrorWrapper';
import { TournamentTableOverlay } from './TournamentTableOverlay';

interface Column {
  key: string;
  label: string;
}

interface BaseOverlayProps {
  columns: Column[];
  title: string;
  rankCalculator: (players: PlayerStats[]) => PlayerStats[];
  renderPlayerName: (player: PlayerStats) => React.ReactNode;
  renderCell: (player: PlayerStats, columnKey: string) => React.ReactNode;
}

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

export const BaseOverlay: React.FC<BaseOverlayProps> = ({
  columns,
  title,
  rankCalculator,
  renderPlayerName,
  renderCell
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

  // URL params approach
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

  return (
    <LoadingErrorWrapper
      loading={loading}
      error={fetchError}
    >
      {standings && tournament && finalDivisionName ? (
        <TournamentTableOverlay
          tournament={tournament}
          standings={standings}
          columns={columns}
          title={title}
          divisionName={finalDivisionName}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      ) : (
        <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};