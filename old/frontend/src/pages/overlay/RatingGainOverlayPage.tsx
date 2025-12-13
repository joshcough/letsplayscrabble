import React from "react";

import { TournamentTableOverlay } from "../../components/shared/TournamentTableOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";
import { Theme } from "../../types/theme";

const RatingGainOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "ratingDiff", label: "Rating +/-" },
    { key: "currentRating", label: "New Rating" },
    { key: "initialRating", label: "Old Rating" },
  ];

  const renderPlayerName = (player: RankedPlayerStats) => player.name;

  const renderCell = (player: RankedPlayerStats, columnKey: string, theme: Theme) => {
    switch (columnKey) {
      case "rank":
        return <span className="text-2xl font-black">#{player.rank}</span>;
      case "ratingDiff":
        return (
          <span
            className={`font-black text-2xl ${
              player.ratingDiff > 0 ? 'text-red-600' : player.ratingDiff < 0 ? 'text-blue-600' : theme.colors.textPrimary
            }`}
          >
            {formatNumberWithSign(player.ratingDiff)}
          </span>
        );
      case "currentRating":
        return <span className={`font-mono font-black text-xl ${theme.colors.textPrimary}`}>{player.currentRating}</span>;
      case "initialRating":
        return <span className={`font-mono font-black text-xl ${theme.colors.textPrimary}`}>{player.initialRating}</span>;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="ratingGain" apiService={apiService}>
      {({ tournament, players, divisionName }) => {
        return (
          <TournamentTableOverlay
            tournament={tournament}
            standings={players}
            columns={columns}
            title="Rating Gain Leaders"
            divisionName={divisionName}
            renderPlayerName={renderPlayerName}
            renderCell={renderCell}
          />
        );
      }}
    </UsePlayerStatsCalculation>
  );
};

export default RatingGainOverlayPage;