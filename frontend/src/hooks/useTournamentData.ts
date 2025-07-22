import { useState, useEffect } from 'react';
import { ProcessedTournament, PlayerStats } from '@shared/types/tournament';
import DisplaySourceManager from './DisplaySourceManager';
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
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const processTournamentData = (tournamentData: ProcessedTournament) => {
    setTournament(tournamentData);

    if (divisionId !== undefined) {
      const divisionStandings = rankCalculator
        ? rankCalculator(tournamentData.standings[divisionId])
        : tournamentData.standings[divisionId];
      setStandings(divisionStandings);
    }
  };

  const fetchTournamentData = async () => {
    if (tournamentId === undefined || divisionId === undefined) return;

    try {
      setLoading(true);
      setFetchError(null);

      console.log('🔄 useTournamentData: Fetching tournament data for ID:', tournamentId, 'division:', divisionId);

      const tournamentData = await fetchTournament(tournamentId);
      processTournamentData(tournamentData);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId, divisionId]);

  // Listen for tournament data broadcasts
  useEffect(() => {
    const displayManager = DisplaySourceManager.getInstance();

    const cleanupTournamentData = displayManager.onTournamentData(({ tournamentId: broadcastTournamentId, data }) => {
      console.log('📥 useTournamentData received TOURNAMENT_DATA:', { broadcastTournamentId, ourTournamentId: tournamentId });

      // Only process if this broadcast is for our tournament
      if (broadcastTournamentId === tournamentId) {
        console.log('✅ Tournament data matches our ID, processing...');
        processTournamentData(data);
        setFetchError(null); // Clear any previous errors
      }
    });

    const cleanupTournamentError = displayManager.onTournamentDataError(({ tournamentId: broadcastTournamentId, error }) => {
      console.log('📥 useTournamentData received TOURNAMENT_DATA_ERROR:', { tournamentId: broadcastTournamentId, error });

      // Only process error if it's for our tournament
      if (broadcastTournamentId === tournamentId) {
        console.log('❌ Tournament data error matches our ID');
        setFetchError(error);
      }
    });

    // Still listen for GamesAdded for fallback (in case worker isn't running)
    const cleanupGamesAdded = displayManager.onGamesAdded((data: { tournamentId: number }) => {
      console.log('📥 useTournamentData received GamesAdded (fallback):', data);
      if (data.tournamentId === tournamentId) {
        console.log('⚠️ Falling back to direct API fetch (worker may not be running)');
        fetchTournamentData();
      }
    });

    return () => {
      cleanupTournamentData();
      cleanupTournamentError();
      cleanupGamesAdded();
    };
  }, [tournamentId]);

  return {
    standings,
    tournament,
    loading,
    fetchError,
    refetch: fetchTournamentData
  };
};