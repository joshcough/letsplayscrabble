import React from "react";
import { useParams } from "react-router-dom";
import { PlayerStats } from "@shared/types/tournament";
import { BasePictureOverlay } from "../../components/shared/BasePictureOverlay";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

const RatingGainWithPicsOverlayPage: React.FC = () => {
  const { tournamentId, divisionName } = useParams<RouteParams>();

  // If we have URL params, use those (false = use URL params)
  // If no URL params, use current match (true = use current match)
  const useCurrentMatch = !tournamentId || !divisionName;

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
    <BasePictureOverlay
      title="Rating Gain Leaders"
      sortType="ratingDiff"
      renderPlayerContent={renderPlayerContent}
      useCurrentMatch={useCurrentMatch}
    />
  );
};

export default RatingGainWithPicsOverlayPage;