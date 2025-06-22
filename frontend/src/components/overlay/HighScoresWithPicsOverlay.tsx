import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import PictureOverlayBase from "./PictureOverlayBase";

const HighScoresWithPicsOverlay: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
    <div className="text-black text-3xl font-bold text-center">
      {player.highScore}
    </div>
  );

  return (
    <PictureOverlayBase
      title="High Scores"
      sortType="highScore"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default HighScoresWithPicsOverlay;