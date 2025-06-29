import React from 'react';
import { PlayerStats } from '@shared/types/tournament';
import { BaseOverlay } from './BaseOverlay';
import { TournamentTableOverlay } from './TournamentTableOverlay';

interface Column {
  key: string;
  label: string;
}

interface TableOverlayProps {
  columns: Column[];
  title: string;
  rankCalculator: (players: PlayerStats[]) => PlayerStats[];
  renderPlayerName: (player: PlayerStats) => React.ReactNode;
  renderCell: (player: PlayerStats, columnKey: string) => React.ReactNode;
}

export const TableOverlay: React.FC<TableOverlayProps> = ({
  columns,
  title,
  rankCalculator,
  renderPlayerName,
  renderCell
}) => {
  return (
    <BaseOverlay rankCalculator={rankCalculator}>
      {({ tournament, standings, divisionName }) => (
        <TournamentTableOverlay
          tournament={tournament}
          standings={standings}
          columns={columns}
          title={title}
          divisionName={divisionName}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      )}
    </BaseOverlay>
  );
};