import React, { useState, useEffect } from "react";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { fetchTournament } from "../../utils/tournamentApi";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";

const RatingGainOverlay: React.FC = () => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

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

  // Calculate ranks based on rating difference (unique to this component)
  const calculateRatingGainRanks = (players: PlayerStats[]): PlayerStats[] => {
    const sortedPlayers = [...players].sort((a, b) => {
      return b.ratingDiff - a.ratingDiff;
    });

    return sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  };

  const fetchTournamentData = async (tournamentId: number, divisionId: number) => {
    try {
      setLoading(true);
      setFetchError(null);

      const tournamentData = await fetchTournament(tournamentId);
      setTournament(tournamentData);

      const divisionStandings = calculateRatingGainRanks(tournamentData.standings[divisionId]);
      setStandings(divisionStandings);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tournament data when currentMatch changes
  useEffect(() => {
    if (currentMatch?.tournament_id !== undefined && currentMatch?.division_id !== undefined) {
      fetchTournamentData(currentMatch.tournament_id, currentMatch.division_id);
    }
  }, [currentMatch]);

  // Show loading state
  if (matchLoading || loading) {
    return <div className="text-black p-2">Loading...</div>;
  }

  // Show errors
  if (matchError || fetchError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{matchError || fetchError}</p>
        </div>
      </div>
    );
  }

  // Show message when no data
  if (!currentMatch || !standings || !tournament) {
    return <div className="text-black p-2">No current match or tournament data</div>;
  }

  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-4xl font-bold text-center mb-4">
        {tournament.name} {tournament.lexicon} Div{" "}
        {tournament.divisions[currentMatch.division_id].name}
      </div>
      <div className="text-black text-4xl font-bold text-center mb-4">
        Rating Gain Leaders
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
                          ? "50px"
                          : ["rank"].includes(column.key)
                            ? "50px"
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
                <td
                  className={`px-4 py-2 text-center ${
                    player.ratingDiff > 0 ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {formatNumberWithSign(player.ratingDiff)}
                </td>
                <td className="px-4 py-2 text-center">
                  {player.currentRating}
                </td>
                <td className="px-4 py-2 text-center">
                  {player.initialRating}
                </td>
                <td className="px-4 py-2 text-center">{player.wins}</td>
                <td className="px-4 py-2 text-center">{player.losses}</td>
                <td className="px-4 py-2 text-center">{player.ties}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RatingGainOverlay;