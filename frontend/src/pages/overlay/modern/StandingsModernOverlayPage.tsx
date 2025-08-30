import React from "react";

import { TournamentTableModernOverlay } from "../../../components/shared/TournamentTableModernOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../../services/interfaces";
import { formatNumberWithSign } from "../../../utils/formatUtils";
import { Theme } from "../../../types/theme";

const StandingsModernOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "record", label: "Record" },
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High" },
  ];

  const renderPlayerName = (player: RankedPlayerStats) => player.name;

  const renderCell = (player: RankedPlayerStats, columnKey: string, theme: Theme) => {
    switch (columnKey) {
      case "rank":
        return <span className="text-lg font-bold">#{player.rank}</span>;
      case "record":
        const record = player.ties === 0 
          ? `${player.wins}-${player.losses}`
          : `${player.wins}-${player.losses}-${player.ties}`;
        return <span className="font-mono text-lg">{record}</span>;
      case "spread":
        return (
          <span className={`font-bold text-lg ${
            player.spread > 0 ? theme.colors.positiveColor : theme.colors.negativeColor
          }`}>
            {formatNumberWithSign(player.spread)}
          </span>
        );
      case "highScore":
        return <span className={`font-bold ${theme.colors.textPrimary}`}>{player.highScore}</span>;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="standings" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <TournamentTableModernOverlay
          tournament={tournament}
          standings={players}
          columns={columns}
          title="Standings"
          divisionName={divisionName}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default StandingsModernOverlayPage;