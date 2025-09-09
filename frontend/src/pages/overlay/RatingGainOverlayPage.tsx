import React from "react";

import { TournamentTableModernOverlay } from "../../components/shared/TournamentTableModernOverlay";
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
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "ties", label: "Ties" },
  ];

  const renderPlayerName = (player: RankedPlayerStats) => player.name;

  const renderCell = (player: RankedPlayerStats, columnKey: string, theme: Theme) => {
    switch (columnKey) {
      case "rank":
        return <span className="text-xl font-black">#{player.rank}</span>;
      case "ratingDiff":
        return (
          <span
            className={`font-black text-xl ${
              player.ratingDiff > 0 ? theme.colors.positiveColor : theme.colors.negativeColor
            }`}
          >
            {formatNumberWithSign(player.ratingDiff)}
          </span>
        );
      case "currentRating":
        return <span className={`font-mono font-bold text-lg ${theme.colors.textPrimary}`}>{player.currentRating}</span>;
      case "initialRating":
        return <span className={`font-mono font-bold text-lg ${theme.colors.textPrimary}`}>{player.initialRating}</span>;
      case "wins":
        return <span className={`${theme.colors.positiveColor} font-bold text-lg`}>{player.wins}</span>;
      case "losses":
        return <span className={`${theme.colors.negativeColor} font-bold text-lg`}>{player.losses}</span>;
      case "ties":
        return <span className={`${theme.colors.textPrimary} font-bold text-lg`}>{player.ties}</span>;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="ratingGain" apiService={apiService}>
      {({ tournament, players, divisionName }) => {
        return (
          <TournamentTableModernOverlay
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