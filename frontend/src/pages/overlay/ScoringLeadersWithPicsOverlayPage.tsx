import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { PictureOverlay } from "../../components/shared/PictureOverlay";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const ScoringLeadersWithPicsOverlayPage: React.FC = () => {
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
    <PictureOverlay
      title="Scoring Leaders"
      sortType="averageScore"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default ScoringLeadersWithPicsOverlayPage;