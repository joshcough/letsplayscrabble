import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import PictureOverlayCurrentMatch from "./PictureOverlayCurrentMatch";

const HighScoresWithPicsOverlay: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
    <div className="text-black text-3xl font-bold text-center">
      {player.highScore}
    </div>
  );

  return (
    <PictureOverlayCurrentMatch
      title="High Scores"
      sortType="highScore"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default HighScoresWithPicsOverlay;