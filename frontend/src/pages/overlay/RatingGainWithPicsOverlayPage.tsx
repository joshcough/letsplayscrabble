import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { PictureOverlay } from "../../components/shared/PictureOverlay";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const RatingGainWithPicsOverlayPage: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
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
    <PictureOverlay
      title="Rating Gain Leaders"
      sortType="ratingDiff"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default RatingGainWithPicsOverlayPage;