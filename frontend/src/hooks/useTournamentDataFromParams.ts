import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProcessedTournament, PlayerStats } from '@shared/types/tournament';
import DisplaySourceManager from './DisplaySourceManager';
import { fetchTournament } from '../utils/tournamentApi';

type RouteParams = {
  [key: string]: string | undefined;
  userId: string;
  tournamentId: string;
  divisionName: string;
};

export const useTournamentDataFromParams = (rankCalculator?: (players: PlayerStats[]) => PlayerStats[]) => {
  const { userId, tournamentId, divisionName } = useParams<RouteParams>();

  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const processTournamentData = (tournamentData: ProcessedTournament) => {
    setTournament(tournamentData);

    if (divisionName) {
      const divisionIndex = tournamentData.divisions.findIndex(
        div => div.name.toUpperCase() === divisionName.toUpperCase()
      );

      if (divisionIndex === -1) {
        setFetchError(`Division ${divisionName} not found in tournament`);
        return;
      }

      const divisionStandings = rankCalculator
        ? rankCalculator(tournamentData.standings[divisionIndex])
        : tournamentData.standings[divisionIndex];
      setStandings(divisionStandings);
      setFetchError(null); // Clear error if we successfully processed data
    }
  };

  const fetchTournamentData = async () => {
    if (!userId) {
      setFetchError("User ID not found in URL");
      return;
    }

    if (!tournamentId) {
      setFetchError("Tournament ID is required");
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      console.log('🔄 useTournamentDataFromParams: Fetching tournament data for user:', userId, 'tournament ID:', tournamentId, 'division:', divisionName);

      const tournamentData = await fetchTournament(parseInt(userId), Number(tournamentId));
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
    if (userId && tournamentId) {
      fetchTournamentData();
    }
  }, [userId, tournamentId, divisionName]);

  // Listen for tournament data broadcasts
  useEffect(() => {
    if (!userId || !tournamentId) return;

    const displayManager = DisplaySourceManager.getInstance();

    const cleanupTournamentData = displayManager.onTournamentData((broadcastData: any) => {
      console.log('📥 useTournamentDataFromParams received TOURNAMENT_DATA:', broadcastData);

      const { tournamentId: broadcastTournamentId, data, userId: broadcastUserId } = broadcastData;

      // Only process if this broadcast is for our user AND tournament
      if (broadcastUserId === parseInt(userId) && broadcastTournamentId === Number(tournamentId)) {
        console.log('✅ Tournament data matches our user and tournament ID, processing...');
        processTournamentData(data);
      } else {
        console.log('❌ Tournament data is for different user or tournament, ignoring');
      }
    });

    const cleanupTournamentError = displayManager.onTournamentDataError((broadcastData: any) => {
      console.log('📥 useTournamentDataFromParams received TOURNAMENT_DATA_ERROR:', broadcastData);

      const { tournamentId: broadcastTournamentId, error, userId: broadcastUserId } = broadcastData;

      // Only process error if it's for our user AND tournament
      if (broadcastUserId === parseInt(userId) && broadcastTournamentId === Number(tournamentId)) {
        console.log('❌ Tournament data error matches our user and tournament ID');
        setFetchError(error);
      }
    });

    // Listen for GamesAdded for fallback (in case worker isn't running)
    const cleanupGamesAdded = displayManager.onGamesAdded((data: any) => {
      console.log('📥 useTournamentDataFromParams received GamesAdded (fallback):', data);

      // Only process if it's for our user AND tournament
      if (data.userId === parseInt(userId) && data.tournamentId === Number(tournamentId)) {
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
    divisionName,
    refetch: fetchTournamentData
  };
};