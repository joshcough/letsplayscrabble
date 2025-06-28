import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProcessedTournament, PlayerStats } from '@shared/types/tournament';
import { useSocketConnection } from './useSocketConnection';
import { useGamesAdded } from '../utils/socketHelpers';
import { fetchTournament } from '../utils/tournamentApi';

type RouteParams = {
  [key: string]: string | undefined;
  tournamentId: string;
  divisionName: string;
};

export const useTournamentDataFromParams = (rankCalculator?: (players: PlayerStats[]) => PlayerStats[]) => {
  const { tournamentId, divisionName } = useParams<RouteParams>();
  const { socket } = useSocketConnection();

  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
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

      const divisionIndex = tournamentData.divisions.findIndex(
        div => div.name.toUpperCase() === divisionName?.toUpperCase()
      );

      if (divisionIndex === -1) {
        throw new Error(`Division ${divisionName} not found in tournament`);
      }

      const divisionStandings = rankCalculator
        ? rankCalculator(tournamentData.standings[divisionIndex])
        : tournamentData.standings[divisionIndex];
      setStandings(divisionStandings);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId, divisionName]);

  // Listen for games being added
  useGamesAdded(socket, (data: { tournamentId: number }) => {
    if (data.tournamentId === Number(tournamentId)) {
      fetchTournamentData();
    }
  });

  return {
    standings,
    tournament,
    loading,
    fetchError,
    divisionName,
    refetch: fetchTournamentData
  };
};