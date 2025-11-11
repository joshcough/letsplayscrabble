import React from "react";

import { TournamentTableOverlay } from "../../components/shared/TournamentTableOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { Theme } from "../../types/theme";

const HighScoresOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "highScore", label: "High Score" },
  ];

  const renderPlayerName = (player: RankedPlayerStats) => player.name;

  const renderCell = (player: RankedPlayerStats, columnKey: string, theme: Theme) => {
    switch (columnKey) {
      case "rank":
        return <span className="text-2xl font-black">#{player.rank}</span>;
      case "highScore":
        return <span className={`text-2xl font-mono font-black ${theme.colors.textPrimary}`}>{player.highScore}</span>;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="highScore" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <TournamentTableOverlay
          tournament={tournament}
          standings={players}
          columns={columns}
          title="High Scores"
          divisionName={divisionName}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default HighScoresOverlayPage;
