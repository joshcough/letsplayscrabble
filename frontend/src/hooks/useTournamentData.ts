import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const { userId } = useParams<{ userId: string }>();
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
    if (!userId) {
      setFetchError("User ID not found in URL");
      return;
    }

    if (tournamentId === undefined || divisionId === undefined) return;

    try {
      setLoading(true);
      setFetchError(null);

      console.log('🔄 useTournamentData: Fetching tournament data for user:', userId, 'tournament ID:', tournamentId, 'division:', divisionId);

      const tournamentData = await fetchTournament(parseInt(userId), tournamentId);
      processTournamentData(tournamentData);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
      setFetchError(err instanceof Error ? err.message : "Failed to fetch tournament data");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when userId and tournament info are available
  useEffect(() => {
    if (userId) {
      fetchTournamentData();
    }
  }, [userId, tournamentId, divisionId]);

  // Listen for tournament data broadcasts
  useEffect(() => {
    if (!userId || !tournamentId) return;

    const displayManager = DisplaySourceManager.getInstance();

    const cleanupTournamentData = displayManager.onTournamentData((broadcastData: any) => {
      console.log('📥 useTournamentData received TOURNAMENT_DATA:', broadcastData);

      const { tournamentId: broadcastTournamentId, data, userId: broadcastUserId } = broadcastData;

      // Only process if this broadcast is for our user AND tournament
      if (broadcastUserId === parseInt(userId) && broadcastTournamentId === tournamentId) {
        console.log('✅ Tournament data matches our user and tournament ID, processing...');
        processTournamentData(data);
        setFetchError(null); // Clear any previous errors
      } else {
        console.log('❌ Tournament data is for different user or tournament, ignoring');
      }
    });

    const cleanupTournamentError = displayManager.onTournamentDataError((broadcastData: any) => {
      console.log('📥 useTournamentData received TOURNAMENT_DATA_ERROR:', broadcastData);

      const { tournamentId: broadcastTournamentId, error, userId: broadcastUserId } = broadcastData;

      // Only process error if it's for our user AND tournament
      if (broadcastUserId === parseInt(userId) && broadcastTournamentId === tournamentId) {
        console.log('❌ Tournament data error matches our user and tournament ID');
        setFetchError(error);
      }
    });

    // Listen for GamesAdded for fallback (in case worker isn't running)
    const cleanupGamesAdded = displayManager.onGamesAdded((data: any) => {
      console.log('📥 useTournamentData received GamesAdded (fallback):', data);

      // Only process if it's for our user AND tournament
      if (data.userId === parseInt(userId) && data.tournamentId === tournamentId) {
        console.log('⚠️ Falling back to direct API fetch (worker may not be running)');
        fetchTournamentData();
      }
    });

    return () => {
      cleanupTournamentData();
      cleanupTournamentError();
      cleanupGamesAdded();
    };
  }, [userId, tournamentId]);

  return {
    standings,
    tournament,
    loading,
    fetchError,
    refetch: fetchTournamentData
  };
};