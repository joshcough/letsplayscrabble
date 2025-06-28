import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import PictureOverlayCurrentMatch from "./PictureOverlayCurrentMatch";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const ScoringLeadersWithPicsOverlay: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
    <>
      {/* Scoring Average */}
      <div className="text-black text-3xl font-bold text-center mb-2">
        {player.averageScoreRounded}
      </div>

      {/* Spread Label */}
      <div className="text-black text-lg font-bold text-center mb-1">
        Spread
      </div>

      {/* Spread Value */}
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
    <PictureOverlayCurrentMatch
      title="Scoring Leaders"
      sortType="averageScore"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default ScoringLeadersWithPicsOverlay;