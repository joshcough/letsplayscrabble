import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { BasePictureOverlay } from "../../components/shared/BasePictureOverlay";

const HighScoresWithPicsOverlayPage: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
    <div className="text-black text-3xl font-bold text-center">
      {player.highScore}
    </div>
  );

  return (
    <BasePictureOverlay
      title="High Scores"
      sortType="highScore"
      renderPlayerContent={renderPlayerContent}
      useCurrentMatch={true}
    />
  );
};

export default HighScoresWithPicsOverlayPage;