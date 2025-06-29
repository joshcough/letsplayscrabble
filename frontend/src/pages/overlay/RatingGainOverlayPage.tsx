import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { BaseOverlayCurrentMatch } from "../../components/shared/BaseOverlayCurrentMatch";
import { calculateRatingGainRanks } from "../../utils/rankingCalculators";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const RatingGainOverlayPage: React.FC = () => {
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

  const renderPlayerName = (player: PlayerStats) => player.name;

  const renderCell = (player: PlayerStats, columnKey: string) => {
    switch (columnKey) {
      case "rank":
        return player.rank;
      case "ratingDiff":
        return (
          <span className={player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"}>
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
    <BaseOverlayCurrentMatch
      columns={columns}
      title="Rating Gain Leaders"
      rankCalculator={calculateRatingGainRanks}
      renderPlayerName={renderPlayerName}
      renderCell={renderCell}
    />
  );
};

export default RatingGainOverlayPage;