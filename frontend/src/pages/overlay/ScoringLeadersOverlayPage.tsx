import React from "react";

import { TournamentTableOverlay } from "../../components/shared/TournamentTableOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const ScoringLeadersOverlayPage: React.FC = () => {
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
        return player.rank;
      case "averageScoreRounded":
        return player.averageScoreRounded;
      case "averageOpponentScore":
        return player.averageOpponentScore;
      case "spread":
        return (
          <span
            className={player.spread > 0 ? "text-red-600" : "text-blue-600"}
          >
            {formatNumberWithSign(player.spread)}
          </span>
        );
      case "highScore":
        return player.highScore;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="averageScore">
      {({ tournament, players, divisionName }) => (
        <TournamentTableOverlay
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

export default ScoringLeadersOverlayPage;
