import React from "react";

import PictureDisplayModern from "../../components/shared/PictureDisplayModern";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";

const StandingsWithPicsModernOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const renderPlayerContent = (player: RankedPlayerStats) => (
    <div className="text-white text-2xl font-bold text-center">
      <div className="mb-1">
        {player.wins}-{player.losses}
        {player.ties > 0 ? `-${player.ties}` : ""}
      </div>
      <div className={player.spread > 0 ? "text-green-400" : "text-red-400"}>
        {formatNumberWithSign(player.spread)}
      </div>
    </div>
  );

  return (
    <UsePlayerStatsCalculation sortType="standings" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <PictureDisplayModern
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

export default StandingsWithPicsModernOverlayPage;