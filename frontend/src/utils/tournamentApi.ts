// import { ProcessedTournament, DivisionStats, TournamentStats } from "@shared/types/tournament";
import { fetchUserTournamentEndpoint, fetchAuthenticatedApiEndpoint } from "./api";
//
// /**
//  * Fetch tournament data by ID for a specific user (for overlays)
//  */
// export const fetchTournament = async (userId: number, tournamentId: number): Promise<ProcessedTournament> => {
//   try {
//     console.log("Fetching tournament data for user:", userId, "tournament ID:", tournamentId);
//
//     const tournamentData = await fetchUserTournamentEndpoint<ProcessedTournament>(
//       userId,
//       `/tournaments/${tournamentId}`,
//       `fetching tournament ${tournamentId} for user ${userId}`
//     );
//
//     if (!tournamentData) {
//       throw new Error(`Tournament ${tournamentId} not found for user ${userId}`);
//     }
//
//     return tournamentData;
//   } catch (error) {
//     console.error("Error fetching tournament data for user:", error);
//     throw error;
//   }
// };
//
// /**
//  * Fetch tournament data by ID for authenticated admin user
//  */
// export const fetchTournamentForAdmin = async (tournamentId: number): Promise<ProcessedTournament> => {
//   try {
//     console.log("Fetching tournament data for admin, tournament ID:", tournamentId);
//
//     const tournamentData = await fetchAuthenticatedApiEndpoint<ProcessedTournament>(
//       `/api/tournaments/${tournamentId}`,
//       `fetching tournament ${tournamentId} for admin`
//     );
//
//     if (!tournamentData) {
//       throw new Error(`Tournament ${tournamentId} not found`);
//     }
//
//     return tournamentData;
//   } catch (error) {
//     console.error("Error fetching tournament data for admin:", error);
//     throw error;
//   }
// };
//
// /**
//  * User-scoped division stats (for overlays)
//  */
// export const fetchDivisionStats = async (userId: number, tournamentId: number, divisionId: number): Promise<DivisionStats> => {
//   const stats = await fetchUserTournamentEndpoint<DivisionStats>(
//     userId,
//     `/tournaments/${tournamentId}/divisions/${divisionId}/stats`,
//     `fetching division stats for user ${userId}`
//   );
//
//   if (!stats) {
//     throw new Error(`Division stats not found for tournament ${tournamentId}, division ${divisionId}`);
//   }
//
//   return stats;
// };
//
// /**
//  * User-scoped tournament stats (for overlays)
//  */
// export const fetchTournamentStats = async (userId: number, tournamentId: number): Promise<DivisionStats> => {
//   const stats = await fetchUserTournamentEndpoint<DivisionStats>(
//     userId,
//     `/tournaments/${tournamentId}/stats`,
//     `fetching tournament stats for user ${userId}`
//   );
//
//   if (!stats) {
//     throw new Error(`Tournament stats not found for tournament ${tournamentId}`);
//   }
//
//   return stats;
// };