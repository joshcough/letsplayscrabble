import React from "react";

import { TournamentTableOverlay } from "../../components/shared/TournamentTableOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";
import { Theme } from "../../types/theme";

const ScoringLeadersOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "averageScoreRounded", label: "Avg Pts For" },
    { key: "averageOpponentScore", label: "Avg Pts Ag" },
  ];

  const renderPlayerName = (player: RankedPlayerStats) => player.name;

  const renderCell = (player: RankedPlayerStats, columnKey: string, theme: Theme) => {
    switch (columnKey) {
      case "rank":
        return <span className="text-2xl font-black">#{player.rank}</span>;
      case "averageScoreRounded":
        return <span className={`text-2xl font-mono font-black ${theme.colors.textPrimary}`}>{player.averageScoreRounded}</span>;
      case "averageOpponentScore":
        return <span className={`font-mono font-black text-xl ${theme.colors.textPrimary}`}>{player.averageOpponentScore}</span>;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="averageScore" apiService={apiService}>
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