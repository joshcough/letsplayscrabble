import React from "react";

import PictureDisplay from "../../components/shared/PictureDisplay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";
import { ThemeProvider } from "../../components/shared/ThemeProvider";

const ScoringLeadersWithPicsOverlayPage: React.FC<{
  apiService: ApiService;
}> = ({ apiService }) => {
  return (
    <UsePlayerStatsCalculation sortType="averageScore" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <ThemeProvider
          tournamentId={tournament.id}
          tournamentTheme={tournament.theme || 'scrabble'}
        >
          {(theme, themeClasses) => {
            const renderPlayerContent = (player: RankedPlayerStats) => (
              <>
                <div className={`${theme.colors.textPrimary} text-5xl font-black text-center mb-3`}>
                  {player.averageScoreRounded}
                </div>

                <div className={`${theme.colors.textAccent} text-lg font-bold text-center mb-2 uppercase tracking-wider`}>
                  Avg Points For
                </div>
              </>
            );

            return (
              <PictureDisplay
                tournament={tournament}
                standings={players.slice(0, 5)} // Top 5
                title="Scoring Leaders"
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

export default ScoringLeadersWithPicsOverlayPage;