import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import PictureOverlayBase from "./PictureOverlayBase";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const RatingGainWithPicsOverlay: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
    <>
      {/* Rating Gain */}
      <div
        className={`text-3xl font-bold text-center mb-2 ${
          player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"
        }`}
      >
        {formatNumberWithSign(player.ratingDiff)}
      </div>

      {/* New Rating Label */}
      <div className="text-black text-lg font-bold text-center mb-1">
        New Rating
      </div>

      {/* Current Rating Value */}
      <div className="text-black text-2xl font-bold text-center">
        {player.currentRating}
      </div>
    </>
  );

  return (
    <PictureOverlayBase
      title="Rating Gain Leaders"
      sortType="ratingDiff"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default RatingGainWithPicsOverlay;