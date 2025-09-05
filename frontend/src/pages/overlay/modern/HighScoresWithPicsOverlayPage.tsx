import React from "react";

import PictureDisplayModern from "../../../components/shared/PictureDisplayModern";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../../services/interfaces";
import { BaseModernOverlay } from "../../../components/shared/BaseModernOverlay";

const HighScoresWithPicsOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  return (
    <BaseModernOverlay>
      {(theme, themeClasses) => {
        const renderPlayerContent = (player: RankedPlayerStats) => (
          <div className={`${theme.colors.textPrimary} text-3xl font-bold text-center`}>
            {player.highScore}
          </div>
        );

        return (
          <UsePlayerStatsCalculation sortType="highScore" apiService={apiService}>
            {({ tournament, players, divisionName }) => (
              <PictureDisplayModern
                tournament={tournament}
                standings={players.slice(0, 5)} // Top 5 high scores
                title="High Scores"
                divisionName={divisionName}
                renderPlayerContent={renderPlayerContent}
              />
            )}
          </UsePlayerStatsCalculation>
        );
      }}
    </BaseModernOverlay>
  );
};

export default HighScoresWithPicsOverlayPage;