import React from 'react';
import { PlayerStats } from '@shared/types/tournament';
import { BaseOverlay } from './BaseOverlay';
import { SortType, calculateRanksBySortType } from '../../utils/pictureOverlayUtils';
import PictureDisplay from '../overlay/PictureDisplay';

interface PictureOverlayProps {
  title: string;
  sortType: SortType;
  renderPlayerContent: (player: PlayerStats) => React.ReactNode;
}

export const PictureOverlay: React.FC<PictureOverlayProps> = ({
  title,
  sortType,
  renderPlayerContent
}) => {
  const rankCalculator = (players: PlayerStats[]) =>
    calculateRanksBySortType(players, sortType);

  return (
    <BaseOverlay rankCalculator={rankCalculator}>
      {({ tournament, standings, divisionName }) => (
        <PictureDisplay
          tournament={tournament}
          standings={standings}
          title={title}
          divisionName={divisionName}
          renderPlayerContent={renderPlayerContent}
        />
      )}
    </BaseOverlay>
  );
};