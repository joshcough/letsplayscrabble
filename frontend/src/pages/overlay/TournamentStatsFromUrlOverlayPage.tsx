import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProcessedTournament } from "@shared/types/tournament";
import { useSocketConnection } from "../../hooks/useSocketConnection";
import { useGamesAdded } from "../../utils/socketHelpers";
import { fetchTournament } from "../../utils/tournamentApi";
import { LoadingErrorWrapper } from "../../components/shared/LoadingErrorWrapper";
import { TournamentDivisionStatsDisplay } from "../../components/shared/TournamentDivisionStatsDisplay";
import { calculateTournamentStats, calculateDivisionStats } from "../../utils/tournamentStatsCalculators";

type RouteParams = {
  [key: string]: string | undefined;
  tournamentId: string;
  divisionName?: string; // Optional - if not provided, show all divisions
};

const TournamentStatsFromUrlOverlay: React.FC = () => {
  const { tournamentId, divisionName } = useParams<RouteParams>();
  const { socket } = useSocketConnection();

  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTournamentData = async () => {
    if (!tournamentId) {
      setFetchError("Tournament ID is required");
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const tournamentData = await fetchTournament(Number(tournamentId));
      setTournament(tournamentData);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  // Listen for games being added
  useGamesAdded(socket, (data: { tournamentId: number }) => {
    if (data.tournamentId === Number(tournamentId)) {
      fetchTournamentData();
    }
  });

  const stats = React.useMemo(() => {
    if (!tournament) return null;

    if (divisionName) {
      // Show specific division stats
      const divisionIndex = tournament.divisions.findIndex(
        div => div.name.toUpperCase() === divisionName.toUpperCase()
      );

      if (divisionIndex === -1) return null;

      // We need standings for division stats, but we don't have them here
      // This is a limitation - division stats need the processed standings
      return calculateDivisionStats(tournament.standings[divisionIndex], tournament, divisionIndex);
    } else {
      // Show tournament-wide stats
      return calculateTournamentStats(tournament);
    }
  }, [tournament, divisionName]);

  return (
    <LoadingErrorWrapper
      loading={loading}
      error={fetchError}
    >
      {stats && tournament ? (
        <TournamentDivisionStatsDisplay
          tournament={tournament}
          divisionName={divisionName}
          stats={stats}
        />
      ) : (
        <div className="text-black p-2">Loading...</div>
      )}
    </LoadingErrorWrapper>
  );
};

export default TournamentStatsFromUrlOverlay;