import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import PictureOverlayUrl from "./PictureOverlayUrl";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const StandingsWithPicsOverlay: React.FC = () => {
  const renderPlayerContent = (player: PlayerStats) => (
    <>
      {/* Record */}
      <div className="text-black text-2xl font-bold text-center mb-2">
        {player.wins}-{player.losses}{player.ties > 0 ? `-${player.ties}` : ""} {formatNumberWithSign(player.spread)}
      </div>
    </>
  );

  return (
    <PictureOverlayUrl
      title="Standings"
      sortType="standings"
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default StandingsWithPicsOverlay;