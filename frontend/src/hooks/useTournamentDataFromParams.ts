import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProcessedTournament, PlayerStats } from '@shared/types/tournament';
import DisplaySourceManager from './DisplaySourceManager';
import { fetchTournament } from '../utils/tournamentApi';

type RouteParams = {
  [key: string]: string | undefined;
  tournamentId: string;
  divisionName: string;
};

export const useTournamentDataFromParams = (rankCalculator?: (players: PlayerStats[]) => PlayerStats[]) => {
  const { tournamentId, divisionName } = useParams<RouteParams>();

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
    if (!tournamentId) {
      setFetchError("Tournament ID is required");
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      console.log('🔄 useTournamentDataFromParams: Fetching tournament data for ID:', tournamentId, 'division:', divisionName);

      const tournamentData = await fetchTournament(Number(tournamentId));
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
  }, [tournamentId, divisionName]);

  // Listen for tournament data broadcasts
  useEffect(() => {
    const displayManager = DisplaySourceManager.getInstance();

    const cleanupTournamentData = displayManager.onTournamentData(({ tournamentId: broadcastTournamentId, data }) => {
      console.log('📥 useTournamentDataFromParams received TOURNAMENT_DATA:', { broadcastTournamentId, ourTournamentId: Number(tournamentId) });

      // Only process if this broadcast is for our tournament
      if (broadcastTournamentId === Number(tournamentId)) {
        console.log('✅ Tournament data matches our ID, processing...');
        processTournamentData(data);
      }
    });

    const cleanupTournamentError = displayManager.onTournamentDataError(({ tournamentId: broadcastTournamentId, error }) => {
      console.log('📥 useTournamentDataFromParams received TOURNAMENT_DATA_ERROR:', { tournamentId: broadcastTournamentId, error });

      // Only process error if it's for our tournament
      if (broadcastTournamentId === Number(tournamentId)) {
        console.log('❌ Tournament data error matches our ID');
        setFetchError(error);
      }
    });

    // Still listen for GamesAdded for fallback (in case worker isn't running)
    const cleanupGamesAdded = displayManager.onGamesAdded((data: { tournamentId: number }) => {
      console.log('📥 useTournamentDataFromParams received GamesAdded (fallback):', data);
      if (data.tournamentId === Number(tournamentId)) {
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
    divisionName,
    refetch: fetchTournamentData
  };
};