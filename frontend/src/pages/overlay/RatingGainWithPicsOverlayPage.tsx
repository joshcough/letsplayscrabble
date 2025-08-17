import React from "react";

import PictureDisplay from "../../components/shared/PictureDisplay";
import { UsePlayerStatsCalculation, RankedPlayerStats } from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";

const RatingGainWithPicsOverlayPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const renderPlayerContent = (player: RankedPlayerStats) => (
    <>
      <div
        className={`text-3xl font-bold text-center mb-2 ${
          player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"
        }`}
      >
        {formatNumberWithSign(player.ratingDiff)}
      </div>

      <div className="text-black text-lg font-bold text-center mb-1">
        New Rating
      </div>

      <div className="text-black text-2xl font-bold text-center">
        {player.currentRating}
      </div>
    </>
  );

  return (
    <UsePlayerStatsCalculation sortType="ratingGain" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <PictureDisplay
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

export default RatingGainWithPicsOverlayPage;
