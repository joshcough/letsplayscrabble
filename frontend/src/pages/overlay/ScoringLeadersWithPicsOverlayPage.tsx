import React from "react";

import PictureDisplay from "../../components/shared/PictureDisplay";
import { UsePlayerStatsCalculation } from "../../hooks/usePlayerStatsCalculation";
import { formatNumberWithSign } from "../../utils/formatUtils";

const ScoringLeadersWithPicsOverlayPage: React.FC = () => {
  const renderPlayerContent = (player: any) => (
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
    <UsePlayerStatsCalculation sortType="averageScore">
      {({ tournament, players, divisionName }) => (
        <PictureDisplay
          tournament={tournament}
          standings={players.slice(0, 5)} // Top 5 scoring leaders
          title="Scoring Leaders"
          divisionName={divisionName}
          renderPlayerContent={renderPlayerContent}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default ScoringLeadersWithPicsOverlayPage;
