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
              className={`text-5xl font-black text-center mb-3 ${
                player.ratingDiff > 0 ? 'text-red-600' : player.ratingDiff < 0 ? 'text-blue-600' : theme.colors.textPrimary
              }`}
            >
              {formatNumberWithSign(player.ratingDiff)}
            </div>

            <div className={`${theme.colors.textAccent} text-lg font-bold text-center mb-2 uppercase tracking-wider`}>
              New Rating
            </div>

            <div className={`${theme.colors.textPrimary} text-4xl font-black text-center`}>
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