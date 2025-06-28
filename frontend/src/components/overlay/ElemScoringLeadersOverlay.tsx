import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { BaseOverlayCurrentMatch } from "../shared/BaseOverlayCurrentMatch";
import { calculateScoringRanks } from "../../utils/rankingCalculators";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const ElemScoringLeadersOverlay: React.FC = () => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "averageScoreRounded", label: "Avg Pts For" },
    { key: "averageOpponentScore", label: "Avg Pts Ag" },
    { key: "spread", label: "Spread" },
  ];

  const renderPlayerName = (player: PlayerStats) => (
    <span>{player.etc.firstname1} & {player.etc.firstname2}</span>
  );

  const renderCell = (player: PlayerStats, columnKey: string) => {
    switch (columnKey) {
      case "rank":
        return player.rank;
      case "averageScoreRounded":
        return player.averageScoreRounded;
      case "averageOpponentScore":
        return player.averageOpponentScore;
      case "spread":
        return (
          <span className={player.spread > 0 ? "text-red-600" : "text-blue-600"}>
            {formatNumberWithSign(player.spread)}
          </span>
        );
      default:
        return "";
    }
  };

  return (
    <BaseOverlayCurrentMatch
      columns={columns}
      title="Scoring Leaders"
      rankCalculator={calculateScoringRanks}
      renderPlayerName={renderPlayerName}
      renderCell={renderCell}
    />
  );
};

export default ElemScoringLeadersOverlay;