import React from "react";

import PictureDisplay from "../../components/shared/PictureDisplay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";
import { ThemeProvider } from "../../components/shared/ThemeProvider";

const StandingsWithPicsOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  return (
    <UsePlayerStatsCalculation sortType="standings" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <ThemeProvider
          tournamentId={tournament.id}
          tournamentTheme={tournament.theme || 'scrabble'}
        >
          {(theme, themeClasses) => {
            const renderPlayerContent = (player: RankedPlayerStats) => (
              <div className={`${theme.colors.textPrimary} text-3xl font-black text-center`}>
                <div className="mb-2">
                  {player.wins}-{player.losses}
                  {player.ties > 0 ? `-${player.ties}` : ""}
                </div>
                <div className={`text-2xl font-bold ${player.spread > 0 ? 'text-red-600' : player.spread < 0 ? 'text-blue-600' : theme.colors.textPrimary}`}>
                  {formatNumberWithSign(player.spread)}
                </div>
              </div>
            );

            return (
              <PictureDisplay
                tournament={tournament}
                standings={players.slice(0, 5)} // Top 5 only
                title="Standings"
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

export default StandingsWithPicsOverlayPage;