import React from "react";

import PictureDisplayModern from "../../components/shared/PictureDisplayModern";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";
import { BaseModernOverlay } from "../../components/shared/BaseModernOverlay";

const RatingGainWithPicsOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {

  return (
    <BaseModernOverlay>
      {(theme, themeClasses) => {
        const renderPlayerContent = (player: RankedPlayerStats) => (
          <>
            <div
              className={`text-3xl font-bold text-center mb-2 ${
                player.ratingDiff > 0 ? theme.colors.positiveColor : theme.colors.negativeColor
              }`}
            >
              {formatNumberWithSign(player.ratingDiff)}
            </div>

            <div className={`${theme.colors.textAccent} text-sm font-semibold text-center mb-1 uppercase tracking-wider`}>
              New Rating
            </div>

            <div className={`${theme.colors.textPrimary} text-2xl font-bold text-center`}>
              {player.currentRating}
            </div>
          </>
        );

        return (
          <UsePlayerStatsCalculation sortType="ratingGain" apiService={apiService}>
            {({ tournament, players, divisionName }) => (
              <PictureDisplayModern
                tournament={tournament}
                standings={players.slice(0, 5)} // Top 5 rating gainers
                title="Rating Gain Leaders"
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

export default RatingGainWithPicsOverlayPage;