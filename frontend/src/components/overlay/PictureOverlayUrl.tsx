import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useGamesAdded } from "../../utils/socketHelpers";
import { fetchTournament } from "../../utils/tournamentApi";
import { calculateRanksBySortType, SortType } from "../../utils/pictureOverlayUtils";
import PictureDisplay from "./PictureDisplay";

type RouteParams = {
  [key: string]: string | undefined;
  tournamentId: string;
  divisionName: string;
}

interface PictureOverlayUrlProps {
  title: string;
  sortType: SortType;
  renderPlayerContent: (player: PlayerStats) => React.ReactNode;
}

const PictureOverlayUrl: React.FC<PictureOverlayUrlProps> = ({
  title,
  sortType,
  renderPlayerContent
}) => {
  const { tournamentId, divisionName } = useParams<RouteParams>();
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { socket } = useSocketConnection();

  const fetchTournamentData = async () => {
    try {
      if (!tournamentId) {
        throw new Error("Tournament ID is required");
      }

      setLoading(true);
      setFetchError(null);

      const tournamentData = await fetchTournament(Number(tournamentId));
      setTournament(tournamentData);

      // Find the division index
      const divisionIndex = tournamentData.divisions.findIndex(
        div => div.name.toUpperCase() === divisionName?.toUpperCase()
      );

      if (divisionIndex === -1) {
        throw new Error(`Division ${divisionName} not found in tournament`);
      }

      const divisionStandings = calculateRanksBySortType(
        tournamentData.standings[divisionIndex],
        sortType
      );
      setStandings(divisionStandings);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount and when params change
  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId, divisionName]);

  // Listen for games being added to this tournament
  useGamesAdded(socket, (data: { tournamentId: number }) => {
    if (data.tournamentId === Number(tournamentId)) {
      fetchTournamentData();
    }
  });

  // Show loading state
  if (loading) {
    return <div className="text-black p-2">Loading...</div>;
  }

  // Show errors
  if (fetchError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!standings || !tournament) {
    return <div className="text-black p-2">Loading...</div>;
  }

  return (
    <PictureDisplay
      tournament={tournament}
      standings={standings}
      title={title}
      divisionName={divisionName || ""}
      renderPlayerContent={renderPlayerContent}
    />
  );
};

export default PictureOverlayUrl;