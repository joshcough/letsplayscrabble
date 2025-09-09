import React from "react";

import PictureDisplayModern from "../../components/shared/PictureDisplayModern";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";
import { BaseModernOverlay } from "../../components/shared/BaseModernOverlay";

const ScoringLeadersWithPicsOverlayPage: React.FC<{
  apiService: ApiService;
}> = ({ apiService }) => {
  return (
    <BaseModernOverlay>
      {(theme, themeClasses) => {
        const renderPlayerContent = (player: RankedPlayerStats) => (
          <>
            <div className={`${theme.colors.textPrimary} text-5xl font-black text-center mb-3`}>
              {player.averageScoreRounded}
            </div>

            <div className={`${theme.colors.textAccent} text-lg font-bold text-center mb-2 uppercase tracking-wider`}>
              Spread
            </div>

            <div
              className={`text-4xl font-black text-center ${
                player.spread > 0 ? theme.colors.positiveColor : theme.colors.negativeColor
              }`}
            >
              {formatNumberWithSign(player.spread)}
            </div>
          </>
        );

        return (
          <UsePlayerStatsCalculation sortType="averageScore" apiService={apiService}>
            {({ tournament, players, divisionName }) => (
              <PictureDisplayModern
                tournament={tournament}
                standings={players.slice(0, 5)} // Top 5
                title="Scoring Leaders"
                divisionName={divisionName}
                renderPlayerContent={renderPlayerContent}
              />
            )}
          </UsePlayerStatsCalculation>
        );
      }}
    </BaseModernOverlay>
  );
};

export default ScoringLeadersWithPicsOverlayPage;