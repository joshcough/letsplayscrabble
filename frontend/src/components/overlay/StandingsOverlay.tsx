import React from "react";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import useSocketWorker from "../../shared/socket/useSocketWorker";

const StandingsOverlay: React.FC = () => {
  const {
    matchData: matchWithPlayers,
    tournament,
    standings,
    connectionStatus,
    error,
    clientCount // Added this
  } = useSocketWorker();

  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "ties", label: "Ties" },
    { key: "spread", label: "Spread" },
    { key: "averageScore", label: "Avg Pts For" },
    { key: "averageOpponentScore", label: "Avg Pts Ag" },
    { key: "highScore", label: "High" },
    { key: "ratingDiff", label: "Rating +/-" },
  ];

  const formatNumberWithSign = (value: number) => {
    return value > 0 ? `+${value}` : value.toString();
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
          <p className="text-sm mt-2">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  if (!standings) {
    console.log("Still loading:", {
      hasStandings: !!standings,
      hasTournament: !!tournament,
      hasMatchWithPlayers: !!matchWithPlayers
    });
    return <div className="text-black p-2">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center relative"> {/* Added relative */}
      <div className="text-xs text-gray-500 absolute top-0 right-0 mr-2 mt-2">
        Connected Clients: {clientCount}
      </div>
      <div className="text-black text-4xl font-bold text-center mb-4">
        {tournament?.name} {tournament?.lexicon} Division{" "}
        {tournament?.divisions[matchWithPlayers?.matchData.division_id || 0]?.name}{" "}
        Standings
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-white">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-2 ${column.key === "name" ? "text-left" : "text-center"}`}
                  style={{
                    minWidth:
                      column.key === "name"
                        ? "200px"
                        : ["wins", "losses", "ties"].includes(column.key)
                          ? "80px"
                          : ["rank"].includes(column.key)
                            ? "80px"
                            : "100px",
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((player) => (
              <tr key={player.name} className="bg-white">
                <td className="px-4 py-2 text-center">{player.rank}</td>
                <td className="px-4 py-2">{player.name}</td>
                <td className="px-4 py-2 text-center">{player.wins}</td>
                <td className="px-4 py-2 text-center">{player.losses}</td>
                <td className="px-4 py-2 text-center">{player.ties}</td>
                <td className="px-4 py-2 text-center">
                  {formatNumberWithSign(player.spread)}
                </td>
                <td className="px-4 py-2 text-center">
                  {player.averageScore} ({player.averageScoreRankOrdinal})
                </td>
                <td className="px-4 py-2 text-center">
                  {player.averageOpponentScore} (
                  {player.averageOpponentScoreRankOrdinal})
                </td>
                <td className="px-4 py-2 text-center">{player.highScore}</td>
                <td
                  className={`px-4 py-2 text-center ${
                    player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {formatNumberWithSign(player.ratingDiff)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsOverlay;