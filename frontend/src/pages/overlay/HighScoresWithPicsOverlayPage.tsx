import React from "react";
import { useParams } from "react-router-dom";
import { PlayerStats } from "@shared/types/tournament";
import { BasePictureOverlay } from "../../components/shared/BasePictureOverlay";

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

const HighScoresWithPicsOverlayPage: React.FC = () => {
  const { tournamentId, divisionName } = useParams<RouteParams>();

  // If we have URL params, use those (false = use URL params)
  // If no URL params, use current match (true = use current match)
  const useCurrentMatch = !tournamentId || !divisionName;

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
      useCurrentMatch={useCurrentMatch}
    />
  );
};

export default HighScoresWithPicsOverlayPage;