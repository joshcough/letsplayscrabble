import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { PictureOverlay } from "../../components/shared/PictureOverlay";

const HighScoresWithPicsOverlayPage: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
    <div className="text-black text-3xl font-bold text-center">
      {player.highScore}
    </div>
  );

  return (
    <PictureOverlay
      title="High Scores"
      sortType="highScore"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default HighScoresWithPicsOverlayPage;