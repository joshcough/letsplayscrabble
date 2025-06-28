import React from 'react';
import { PlayerStats } from '@shared/types/tournament';
import { useTournamentDataFromParams } from '../../hooks/useTournamentDataFromParams';
import { LoadingErrorWrapper } from './LoadingErrorWrapper';
import { TournamentTableOverlay } from './TournamentTableOverlay';

interface Column {
  key: string;
  label: string;
}

interface BaseOverlayFromParamsProps {
  columns: Column[];
  title: string;
  rankCalculator: (players: PlayerStats[]) => PlayerStats[];
  renderPlayerName: (player: PlayerStats) => React.ReactNode;
  renderCell: (player: PlayerStats, columnKey: string) => React.ReactNode;
}

export const BaseOverlayFromParams: React.FC<BaseOverlayFromParamsProps> = ({
  columns,
  title,
  rankCalculator,
  renderPlayerName,
  renderCell
}) => {
  const { standings, tournament, loading, fetchError, divisionName } = useTournamentDataFromParams(rankCalculator);

  return (
    <LoadingErrorWrapper
      loading={loading}
      error={fetchError}
    >
      {standings && tournament && divisionName ? (
        <TournamentTableOverlay
          tournament={tournament}
          standings={standings}
          columns={columns}
          title={title}
          divisionName={divisionName}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      ) : (
        <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};