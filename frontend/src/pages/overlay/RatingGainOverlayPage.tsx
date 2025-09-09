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
      case "wins":
        return <span className="text-red-600 font-black text-xl">{player.wins}</span>;
      case "losses":
        return <span className="text-blue-600 font-black text-xl">{player.losses}</span>;
      case "ties":
        return <span className={`${theme.colors.textPrimary} font-black text-xl`}>{player.ties}</span>;
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