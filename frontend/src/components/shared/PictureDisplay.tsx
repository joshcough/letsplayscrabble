import React from "react";

import * as Stats from "../../types/stats";
import { getPlayerImageUrl, formatPlayerName } from "../../utils/playerUtils";
import { TournamentDisplayData } from "../shared/BaseOverlay";

interface PictureDisplayProps {
  tournament: TournamentDisplayData;
  standings: Stats.PlayerStats[];
  title: string;
  divisionName: string;
  renderPlayerContent: (player: Stats.PlayerStats) => React.ReactNode;
}

const PictureDisplay: React.FC<PictureDisplayProps> = ({
  tournament,
  standings,
  title,
  divisionName,
  renderPlayerContent,
}) => {
  // Get top 5 players
  const top5Players = standings.slice(0, 5);

  return (
    <div className="flex flex-col items-center pt-1 font-bold">
      <div className="text-black text-6xl font-bold text-center mb-2">
        {title}
      </div>

      <div className="text-black text-4xl font-bold text-center mb-4">
        {tournament.name} {tournament.lexicon} Div {divisionName}
      </div>

      <div className="flex justify-center items-start gap-8 px-4">
        {top5Players.map((player) => (
          <div key={player.name} className="flex flex-col items-center w-40">
            {/* Player Image */}
            <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden border-4 border-gray-300 bg-gray-200">
              <img
                src={getPlayerImageUrl(tournament.dataUrl, player.photo)}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Player Name */}
            <div className="text-black text-xl font-bold text-center mb-2 max-w-40 min-h-[3.5rem] flex items-center justify-center">
              {formatPlayerName(player.name)}
            </div>

            {/* Custom Content */}
            {renderPlayerContent(player)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PictureDisplay;
