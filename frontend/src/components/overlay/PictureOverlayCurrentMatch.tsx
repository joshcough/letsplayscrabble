import React, { useState, useEffect } from "react";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { fetchTournament } from "../../utils/tournamentApi";
import { calculateRanksBySortType, SortType } from "../../utils/pictureOverlayUtils";
import PictureDisplay from "./PictureDisplay";

interface PictureOverlayCurrentMatchProps {
  title: string;
  sortType: SortType;
  renderPlayerContent: (player: PlayerStats) => React.ReactNode;
}

const PictureOverlayCurrentMatch: React.FC<PictureOverlayCurrentMatchProps> = ({
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
    <PictureDisplay
      tournament={tournament}
      standings={standings}
      title={title}
      divisionName={tournament.divisions[currentMatch.division_id].name}
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default PictureOverlayCurrentMatch;