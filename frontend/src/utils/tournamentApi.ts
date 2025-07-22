import { fetchWithAuth } from "../config/api";
import { ProcessedTournament, DivisionStats, TournamentStats } from "@shared/types/tournament";
import { API_BASE } from "../config/api";

/**
 * Fetch tournament data by ID
 */
export const fetchTournament = async (tournamentId: number): Promise<ProcessedTournament> => {
  try {
    console.log("Fetching tournament data for tournament ID:", tournamentId);

    const tournamentData: ProcessedTournament = await fetchWithAuth(
      `/api/tournaments/public/${tournamentId}`
    );
    return tournamentData;
  } catch (error) {
    console.error("Error fetching tournament data:", error);
    throw error;
  }
};

export const fetchDivisionStats = async (tournamentId: number, divisionId: number): Promise<DivisionStats> => {
  const response = await fetch(`${API_BASE}/api/tournaments/public/${tournamentId}/divisions/${divisionId}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch division stats');
  }
  return response.json();
};

export const fetchTournamentStats = async (tournamentId: number): Promise<DivisionStats> => {
  const response = await fetch(`${API_BASE}/api/tournaments/public/${tournamentId}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch tournament stats');
  }
  return response.json();
};