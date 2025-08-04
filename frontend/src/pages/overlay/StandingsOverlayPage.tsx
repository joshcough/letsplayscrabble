import React from "react";

import { TournamentTableOverlay } from "../../components/shared/TournamentTableOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { formatNumberWithSign } from "../../utils/formatUtils";

const StandingsOverlayPage: React.FC = () => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "record", label: "Record" },
    { key: "spread", label: "Spread" },
    { key: "highScore", label: "High" },
  ];

  const renderPlayerName = (player: RankedPlayerStats) => player.name;

  const renderCell = (player: RankedPlayerStats, columnKey: string) => {
    switch (columnKey) {
      case "rank":
        return player.rank;
      case "record":
        if (player.ties === 0) return `${player.wins}-${player.losses}`;
        else return `${player.wins}-${player.losses}-${player.ties}`;
      case "spread":
        return formatNumberWithSign(player.spread);
      case "highScore":
        return player.highScore;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="standings">
      {({ tournament, players, divisionName }) => (
        <TournamentTableOverlay
          tournament={tournament}
          standings={players} // All players
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

export default StandingsOverlayPage;
