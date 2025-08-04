import React from "react";

import PictureDisplay from "../../components/shared/PictureDisplay";
import { UsePlayerStatsCalculation } from "../../hooks/usePlayerStatsCalculation";
import { formatNumberWithSign } from "../../utils/formatUtils";

const StandingsWithPicsOverlayPage: React.FC = () => {
  const renderPlayerContent = (player: any) => (
    <div className="text-black text-2xl font-bold text-center mb-2">
      {player.wins}-{player.losses}
      {player.ties > 0 ? `-${player.ties}` : ""}{" "}
      {formatNumberWithSign(player.spread)}
    </div>
  );

  return (
    <UsePlayerStatsCalculation sortType="standings">
      {({ tournament, players, divisionName }) => (
        <PictureDisplay
          tournament={tournament}
          standings={players.slice(0, 5)} // Top 5 only
          title="Standings"
          divisionName={divisionName}
          renderPlayerContent={renderPlayerContent}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default StandingsWithPicsOverlayPage;
