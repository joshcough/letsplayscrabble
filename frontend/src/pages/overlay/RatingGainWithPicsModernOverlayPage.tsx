import React from "react";

import PictureDisplayModern from "../../components/shared/PictureDisplayModern";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";

const RatingGainWithPicsModernOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const renderPlayerContent = (player: RankedPlayerStats) => (
    <>
      <div
        className={`text-3xl font-bold text-center mb-2 ${
          player.ratingDiff > 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {formatNumberWithSign(player.ratingDiff)}
      </div>

      <div className="text-blue-300 text-sm font-semibold text-center mb-1 uppercase tracking-wider">
        New Rating
      </div>

      <div className="text-white text-2xl font-bold text-center">
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
};

export default RatingGainWithPicsModernOverlayPage;