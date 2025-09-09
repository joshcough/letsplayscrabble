import React from "react";

import { TournamentTableModernOverlay } from "../../components/shared/TournamentTableModernOverlay";
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
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High" },
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
      case "spread":
        return (
          <span className={`font-black text-2xl ${
            player.spread > 0 ? theme.colors.positiveColor : theme.colors.negativeColor
          }`}>
            {formatNumberWithSign(player.spread)}
          </span>
        );
      case "highScore":
        return <span className={`font-black text-xl ${theme.colors.textPrimary}`}>{player.highScore}</span>;
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

export default ScoringLeadersOverlayPage;