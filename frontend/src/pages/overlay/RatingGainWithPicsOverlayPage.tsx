import React from "react";
import { UsePlayerStatsCalculation } from "../../hooks/usePlayerStatsCalculation";
import PictureDisplay from "../../components/shared/PictureDisplay";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const RatingGainWithPicsOverlayPage: React.FC = () => {
  const renderPlayerContent = (player: any) => (
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
    <UsePlayerStatsCalculation sortType="ratingGain">
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
