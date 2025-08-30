import React from "react";

import PictureDisplay from "../../../components/shared/PictureDisplay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../../services/interfaces";

const HighScoresWithPicsOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const renderPlayerContent = (player: RankedPlayerStats) => (
    <div className="text-black text-3xl font-bold text-center">
      {player.highScore}
    </div>
  );

  return (
    <UsePlayerStatsCalculation sortType="highScore" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <PictureDisplay
          tournament={tournament}
          standings={players.slice(0, 5)} // Top 5 high scores
          title="High Scores"
          divisionName={divisionName}
          renderPlayerContent={renderPlayerContent}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default HighScoresWithPicsOverlayPage;
