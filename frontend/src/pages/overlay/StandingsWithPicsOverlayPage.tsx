import React from "react";

import PictureDisplay from "../../components/shared/PictureDisplay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";

const StandingsWithPicsOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const renderPlayerContent = (player: RankedPlayerStats) => (
    <div className="text-black text-2xl font-bold text-center mb-2">
      {player.wins}-{player.losses}
      {player.ties > 0 ? `-${player.ties}` : ""}{" "}
      {formatNumberWithSign(player.spread)}
    </div>
  );

  return (
    <UsePlayerStatsCalculation sortType="standings" apiService={apiService}>
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
