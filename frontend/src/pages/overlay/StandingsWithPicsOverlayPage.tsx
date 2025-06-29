import React from "react";
import { useParams } from "react-router-dom";
import { PlayerStats } from "@shared/types/tournament";
import { BasePictureOverlay } from "../../components/shared/BasePictureOverlay";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

const StandingsWithPicsOverlay: React.FC = () => {
  const { tournamentId, divisionName } = useParams<RouteParams>();

  // If we have URL params, use those (false = use URL params)
  // If no URL params, use current match (true = use current match)
  const useCurrentMatch = !tournamentId || !divisionName;

  const renderPlayerContent = (player: PlayerStats) => (
    <div className="text-black text-2xl font-bold text-center mb-2">
      {player.wins}-{player.losses}{player.ties > 0 ? `-${player.ties}` : ""} {formatNumberWithSign(player.spread)}
    </div>
  );

  return (
    <BasePictureOverlay
      title="Standings"
      sortType="standings"
      renderPlayerContent={renderPlayerContent}
      useCurrentMatch={useCurrentMatch}
    />
  );
};

export default StandingsWithPicsOverlay;