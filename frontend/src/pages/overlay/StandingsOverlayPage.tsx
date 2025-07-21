import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { TableOverlay } from "../../components/shared/TableOverlay";
import { calculateStandingsRanks } from "../../utils/rankingCalculators";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const StandingsOverlayPage: React.FC = () => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "record", label: "Record" },
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High" },
  ];

  const renderPlayerName = (player: PlayerStats) => player.name;

  const renderCell = (player: PlayerStats, columnKey: string) => {
    switch (columnKey) {
      case "rank":
        return player.rank;
      case "record":
        if (player.ties == 0)
          return player.wins + "-" + player.losses;
        else
          return player.wins + "-" + player.losses + "-" + player.ties;
      case "spread":
        return formatNumberWithSign(player.spread);
      case "highScore":
        return player.highScore;
      default:
        return "";
    }
  };

  return (
    <TableOverlay
      columns={columns}
      title="Standings"
      rankCalculator={calculateStandingsRanks}
      renderPlayerName={renderPlayerName}
      renderCell={renderCell}
    />
  );
};

export default StandingsOverlayPage;