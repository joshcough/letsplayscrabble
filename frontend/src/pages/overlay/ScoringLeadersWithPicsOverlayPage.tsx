import React from "react";
import { useParams } from "react-router-dom";
import { PlayerStats } from "@shared/types/tournament";
import { BasePictureOverlay } from "../../components/shared/BasePictureOverlay";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

const ScoringLeadersWithPicsOverlayPage: React.FC = () => {
  const { tournamentId, divisionName } = useParams<RouteParams>();

  // If we have URL params, use those (false = use URL params)
  // If no URL params, use current match (true = use current match)
  const useCurrentMatch = !tournamentId || !divisionName;

  const renderPlayerContent = (player: PlayerStats) => (
    <>
      <div className="text-black text-3xl font-bold text-center mb-2">
        {player.averageScoreRounded}
      </div>

      <div className="text-black text-lg font-bold text-center mb-1">
        Spread
      </div>

      <div
        className={`text-2xl font-bold text-center ${
          player.spread > 0 ? "text-red-600" : "text-blue-600"
        }`}
      >
        {formatNumberWithSign(player.spread)}
      </div>
    </>
  );

  return (
    <BasePictureOverlay
      title="Scoring Leaders"
      sortType="averageScore"
      renderPlayerContent={renderPlayerContent}
      useCurrentMatch={useCurrentMatch}
    />
  );
};

export default ScoringLeadersWithPicsOverlayPage;