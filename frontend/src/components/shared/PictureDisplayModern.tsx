import React from "react";

import { RankedPlayerStats } from "../../hooks/usePlayerStatsCalculation";
import { BaseModernOverlay } from "./BaseModernOverlay";
import { getPlayerImageUrl, formatPlayerName } from "../../utils/playerUtils";
import * as Domain from "@shared/types/domain";
import { getPageTextColor } from "../../utils/themeUtils";

interface PictureDisplayModernProps {
  tournament: Domain.Tournament;
  standings: RankedPlayerStats[];
  title: string;
  divisionName: string;
  renderPlayerContent: (player: RankedPlayerStats) => React.ReactNode;
}

const PictureDisplayModern: React.FC<PictureDisplayModernProps> = ({
  tournament,
  standings,
  title,
  divisionName,
  renderPlayerContent,
}) => {
  // Get top 5 players
  const top5Players = standings.slice(0, 5);

  return (
    <BaseModernOverlay>
      {(theme, themeClasses) => (
        <div className={`${themeClasses.pageBackground} min-h-screen flex items-center justify-center p-6`}>
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className={`text-6xl font-black mb-3 ${theme.name === 'original' ? theme.colors.titleGradient : `text-transparent bg-clip-text ${theme.colors.titleGradient}`}`}>
            {title}
          </h1>
          <div className={`text-3xl ${getPageTextColor(theme, 'secondary')}`}>
            {tournament.name} {tournament.lexicon} • Division {divisionName}
          </div>
        </div>

        <div className="flex justify-center items-start gap-6 px-4">
          {top5Players.map((player, index) => (
            <div key={player.name} className="flex flex-col items-center">
              {/* Rank Badge */}
              <div className="relative mb-4">
                <div className="absolute -top-2 -left-2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-300">
                  <span className={`${theme.colors.textPrimary} font-black text-lg`}>#{index + 1}</span>
                </div>
                
                {/* Player Image */}
                <div className={`w-36 h-36 rounded-2xl overflow-hidden border-2 ${theme.colors.primaryBorder} ${theme.colors.cardBackground} shadow-xl`}>
                  <img
                    src={getPlayerImageUrl(tournament.dataUrl, player.photo)}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Player Name */}
              <div className={`${getPageTextColor(theme, 'primary')} text-3xl font-black text-center mb-4 max-w-48 min-h-[4rem] flex items-center justify-center`}>
                {formatPlayerName(player.name)}
              </div>

              {/* Custom Content - wrapped in modern styling */}
              <div className={`${theme.colors.cardBackground} rounded-xl px-6 py-4 border ${theme.colors.secondaryBorder} min-h-[6rem] flex flex-col justify-center`}>
                {renderPlayerContent(player)}
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      )}
    </BaseModernOverlay>
  );
};

export default PictureDisplayModern;