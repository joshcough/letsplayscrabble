import { fetchWithAuth } from "../config/api";
import { ProcessedTournament } from "@shared/types/tournament";

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