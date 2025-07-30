import React from "react";
import { UsePlayerStatsCalculation } from "../../hooks/usePlayerStatsCalculation";
import PictureDisplay from "../../components/shared/PictureDisplay";

const HighScoresWithPicsOverlayPage: React.FC = () => {
  const renderPlayerContent = (player: any) => (
    <div className="text-black text-3xl font-bold text-center">
      {player.highScore}
    </div>
  );

  return (
    <UsePlayerStatsCalculation sortType="highScore">
      {({ tournament, players, divisionName }) => (
        <PictureDisplay
          tournament={tournament}
          standings={players.slice(0, 5)} // Top 5 high scores
          title="High Scores"
          divisionName={divisionName}
          renderPlayerContent={renderPlayerContent}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default HighScoresWithPicsOverlayPage;
