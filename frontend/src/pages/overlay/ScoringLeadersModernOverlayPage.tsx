import React from "react";

import { TournamentTableModernOverlay } from "../../components/shared/TournamentTableModernOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";

const ScoringLeadersModernOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "averageScoreRounded", label: "Avg Pts For" },
    { key: "averageOpponentScore", label: "Avg Pts Ag" },
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High" },
  ];

  const renderPlayerName = (player: RankedPlayerStats) => player.name;

  const renderCell = (player: RankedPlayerStats, columnKey: string) => {
    switch (columnKey) {
      case "rank":
        return <span className="text-lg font-bold">#{player.rank}</span>;
      case "averageScoreRounded":
        return <span className="text-lg font-mono text-green-300">{player.averageScoreRounded}</span>;
      case "averageOpponentScore":
        return <span className="font-mono text-gray-400">{player.averageOpponentScore}</span>;
      case "spread":
        return (
          <span className={`font-bold text-lg ${
            player.spread > 0 ? "text-green-400" : "text-red-400"
          }`}>
            {formatNumberWithSign(player.spread)}
          </span>
        );
      case "highScore":
        return <span className="font-bold text-yellow-300">{player.highScore}</span>;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="averageScore" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <TournamentTableModernOverlay
          tournament={tournament}
          standings={players}
          columns={columns}
          title="Scoring Leaders"
          divisionName={divisionName}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default ScoringLeadersModernOverlayPage;