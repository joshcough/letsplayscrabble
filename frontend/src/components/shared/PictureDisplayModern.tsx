import React from "react";

import { RankedPlayerStats } from "../../hooks/usePlayerStatsCalculation";
import { getPlayerImageUrl, formatPlayerName } from "../../utils/playerUtils";
import { TournamentDisplayData } from "../shared/BaseOverlay";

interface PictureDisplayModernProps {
  tournament: TournamentDisplayData;
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
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-3">
            {title}
          </h1>
          <div className="text-2xl text-gray-300">
            {tournament.name} {tournament.lexicon} • Division {divisionName}
          </div>
        </div>

        <div className="flex justify-center items-start gap-6 px-4">
          {top5Players.map((player, index) => (
            <div key={player.name} className="flex flex-col items-center">
              {/* Rank Badge */}
              <div className="relative mb-4">
                <div className="absolute -top-2 -left-2 z-10 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">#{index + 1}</span>
                </div>
                
                {/* Player Image */}
                <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-blue-400/50 bg-gradient-to-br from-blue-900/50 to-gray-900/60 shadow-xl">
                  <img
                    src={getPlayerImageUrl(tournament.dataUrl, player.photo)}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Player Name */}
              <div className="text-white text-lg font-bold text-center mb-3 max-w-40 min-h-[3rem] flex items-center justify-center">
                {formatPlayerName(player.name)}
              </div>

              {/* Custom Content - wrapped in modern styling */}
              <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 rounded-xl px-4 py-2 border border-blue-400/30">
                {renderPlayerContent(player)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PictureDisplayModern;