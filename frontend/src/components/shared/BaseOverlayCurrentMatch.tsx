import React from 'react';
import { PlayerStats } from '@shared/types/tournament';
import { useCurrentMatch } from '../../hooks/useCurrentMatch';
import { useTournamentData } from '../../hooks/useTournamentData';
import { LoadingErrorWrapper } from './LoadingErrorWrapper';
import { TournamentTableOverlay } from './TournamentTableOverlay';

interface Column {
  key: string;
  label: string;
}

interface BaseOverlayCurrentMatchProps {
  columns: Column[];
  title: string;
  rankCalculator: (players: PlayerStats[]) => PlayerStats[];
  renderPlayerName: (player: PlayerStats) => React.ReactNode;
  renderCell: (player: PlayerStats, columnKey: string) => React.ReactNode;
}

export const BaseOverlayCurrentMatch: React.FC<BaseOverlayCurrentMatchProps> = ({
  columns,
  title,
  rankCalculator,
  renderPlayerName,
  renderCell
}) => {
  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

  const { standings, tournament, loading, fetchError } = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    rankCalculator
  });

  return (
    <LoadingErrorWrapper
      loading={matchLoading || loading}
      error={matchError || fetchError}
    >
      {currentMatch && standings && tournament ? (
        <TournamentTableOverlay
          tournament={tournament}
          standings={standings}
          columns={columns}
          title={title}
          divisionName={tournament.divisions[currentMatch.division_id].name}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      ) : (
        <div className="text-black p-2">No current match or tournament data</div>
      )}
    </LoadingErrorWrapper>
  );
};