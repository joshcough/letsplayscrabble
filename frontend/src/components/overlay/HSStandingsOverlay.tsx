import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { BaseOverlayFromParams } from "../shared/BaseOverlayFromParams";
import { calculateStandingsRanks } from "../../utils/rankingCalculators";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const HSStandingsOverlay: React.FC = () => {
  const columns = [
    { key: "name", label: "Name" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "ties", label: "Ties" },
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High Score" },
  ];

  const renderPlayerName = (player: PlayerStats) => (
    <span>
      {player.etc.firstname1.join(" ")} {player.etc.lastname1.join(" ")}
    </span>
  );

  const renderCell = (player: PlayerStats, columnKey: string) => {
    switch (columnKey) {
      case "wins":
        return player.wins;
      case "losses":
        return player.losses;
      case "ties":
        return player.ties;
      case "spread":
        return formatNumberWithSign(player.spread);
      case "highScore":
        return player.highScore;
      default:
        return "";
    }
  };

  return (
    <BaseOverlayFromParams
      columns={columns}
      title="Standings"
      rankCalculator={calculateStandingsRanks}
      renderPlayerName={renderPlayerName}
      renderCell={renderCell}
    />
  );
};

export default HSStandingsOverlay;