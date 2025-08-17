import React from "react";

import { TournamentTableOverlay } from "../../components/shared/TournamentTableOverlay";
import {
  UsePlayerStatsCalculation,
  RankedPlayerStats,
} from "../../hooks/usePlayerStatsCalculation";
import { ApiService } from "../../services/interfaces";
import { formatNumberWithSign } from "../../utils/formatUtils";

const RatingGainOverlayPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
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

  const renderCell = (player: RankedPlayerStats, columnKey: string) => {
    switch (columnKey) {
      case "rank":
        return player.rank;
      case "ratingDiff":
        return (
          <span
            className={player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"}
          >
            {formatNumberWithSign(player.ratingDiff)}
          </span>
        );
      case "currentRating":
        return player.currentRating;
      case "initialRating":
        return player.initialRating;
      case "wins":
        return player.wins;
      case "losses":
        return player.losses;
      case "ties":
        return player.ties;
      default:
        return "";
    }
  };

  return (
    <UsePlayerStatsCalculation sortType="ratingGain" apiService={apiService}>
      {({ tournament, players, divisionName }) => (
        <TournamentTableOverlay
          tournament={tournament}
          standings={players}
          columns={columns}
          title="Rating Gain Leaders"
          divisionName={divisionName}
          renderPlayerName={renderPlayerName}
          renderCell={renderCell}
        />
      )}
    </UsePlayerStatsCalculation>
  );
};

export default RatingGainOverlayPage;
