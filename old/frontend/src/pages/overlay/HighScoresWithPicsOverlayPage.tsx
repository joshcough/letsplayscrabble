import React from "react";

import PictureDisplay from "../../components/shared/PictureDisplay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { ThemeProvider } from "../../components/shared/ThemeProvider";

const HighScoresWithPicsOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  return (
    <UsePlayerStatsCalculation sortType="highScore" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <ThemeProvider
          tournamentId={tournament.id}
          tournamentTheme={tournament.theme || 'scrabble'}
        >
          {(theme, themeClasses) => {
            const renderPlayerContent = (player: RankedPlayerStats) => (
              <div className={`${theme.colors.textPrimary} text-5xl font-black text-center`}>
                {player.highScore}
              </div>
            );

            return (
              <PictureDisplay
                tournament={tournament}
                standings={players.slice(0, 5)} // Top 5 high scores
                title="High Scores"
                divisionName={divisionName}
                renderPlayerContent={renderPlayerContent}
                theme={theme}
                themeClasses={themeClasses}
              />
            );
          }}
        </ThemeProvider>
      )}
    </UsePlayerStatsCalculation>
  );
};

export default HighScoresWithPicsOverlayPage;