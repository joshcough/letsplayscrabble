import { useState, useEffect } from 'react';
import { ProcessedTournament, PlayerStats } from '@shared/types/tournament';
import { useSocketConnection } from './useSocketConnection';
import { useGamesAdded } from '../utils/socketHelpers';
import { fetchTournament } from '../utils/tournamentApi';

interface UseTournamentDataProps {
  tournamentId?: number;
  divisionId?: number;
  rankCalculator?: (players: PlayerStats[]) => PlayerStats[];
}

export const useTournamentData = ({
  tournamentId,
  divisionId,
  rankCalculator
}: UseTournamentDataProps) => {
  const { socket } = useSocketConnection();

  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTournamentData = async () => {
    if (tournamentId === undefined || divisionId === undefined) return;

    try {
      setLoading(true);
      setFetchError(null);

      console.log('🔄 useTournamentData: Fetching tournament data for ID:', tournamentId, 'division:', divisionId);

      const tournamentData = await fetchTournament(tournamentId);
      setTournament(tournamentData);

      const divisionStandings = rankCalculator
        ? rankCalculator(tournamentData.standings[divisionId])
        : tournamentData.standings[divisionId];
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
  }, [tournamentId, divisionId]);

  // Listen for games being added to this tournament
  useGamesAdded(socket, (data: { tournamentId: number }) => {
    if (data.tournamentId === tournamentId) {
      fetchTournamentData();
    }
  });

  return {
    standings,
    tournament,
    loading,
    fetchError,
    refetch: fetchTournamentData
  };
};