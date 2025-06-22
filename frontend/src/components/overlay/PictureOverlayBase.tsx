import React, { useState, useEffect } from "react";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { fetchTournament } from "../../utils/tournamentApi";
import { formatNumberWithSign } from "../../utils/tournamentHelpers";
import {
  getPlayerImageUrl,
  formatPlayerName,
  calculateRanksBySortType,
  SortType
} from "../../utils/pictureOverlayUtils";

interface PictureOverlayBaseProps {
  title: string;
  sortType: SortType;
  renderPlayerContent: (player: PlayerStats) => React.ReactNode;
}

const PictureOverlayBase: React.FC<PictureOverlayBaseProps> = ({
  title,
  sortType,
  renderPlayerContent
}) => {
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { currentMatch, loading: matchLoading, error: matchError } = useCurrentMatch();

  const fetchTournamentData = async (tournamentId: number, divisionId: number) => {
    try {
      setLoading(true);
      setFetchError(null);

      const tournamentData = await fetchTournament(tournamentId);
      setTournament(tournamentData);

      const divisionStandings = calculateRanksBySortType(tournamentData.standings[divisionId], sortType);
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

  // Get top 5 players
  const top5Players = standings.slice(0, 5);

  return (
    <div className="flex flex-col items-center pt-8 font-bold">
      <div className="text-black text-6xl font-bold text-center mb-4">
        {title}
      </div>

      <div className="text-black text-4xl font-bold text-center mb-8">
        {tournament.name} {tournament.lexicon} Div{" "}
        {tournament.divisions[currentMatch.division_id].name}
      </div>

      <div className="flex justify-center items-start gap-8 px-4">
        {top5Players.map((player) => (
          <div key={player.name} className="flex flex-col items-center">
            {/* Player Image */}
            <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden border-4 border-gray-300 bg-gray-200">
              <img
                src={getPlayerImageUrl(tournament.data_url, player.photo)}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Player Name */}
            <div className="text-black text-xl font-bold text-center mb-2 max-w-40 min-h-[3.5rem] flex items-center justify-center">
              {formatPlayerName(player.name)}
            </div>

            {/* Custom Content */}
            {renderPlayerContent(player)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PictureOverlayBase;