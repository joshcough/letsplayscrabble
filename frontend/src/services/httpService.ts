// frontend/src/services/httpService.ts
// HTTP implementation of the API service interfaces

import * as Domain from "@shared/types/domain";
import { LoginRequest, LoginSuccessData, StartPollingRequest, PollingSuccessData } from "@shared/types/api";
import { ApiService } from "./interfaces";
import {
  fetchWithAuth,
  postWithAuth,
  putWithAuth,
  deleteWithAuth,
} from "./api";
import {
  baseFetch,
  parseApiResponse,
} from "../utils/api";

export class HttpApiService implements ApiService {
  // ============================================================================
  // AUTHENTICATION SERVICE
  // ============================================================================

  async login(request: LoginRequest): Promise<LoginSuccessData> {
    const response = await baseFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(request),
    });
    const apiResponse = parseApiResponse<LoginSuccessData>(response);
    return apiResponse;
  }

  // ============================================================================
  // TOURNAMENT SERVICE
  // ============================================================================

  async getTournament(userId: number, tournamentId: number): Promise<Domain.Tournament> {
    const response = await fetchWithAuth<Domain.Tournament>(
      `/api/public/users/${userId}/tournaments/${tournamentId}`
    );
    return response;
  }

  async getTournamentSummary(userId: number, tournamentId: number): Promise<Domain.TournamentSummary> {
    // This method would need to be implemented to get just the summary
    // For now, we get the full tournament and extract summary data
    const tournament = await this.getTournament(userId, tournamentId);
    
    // Get polling data from the old endpoint (admin-specific data)
    let pollUntil: Date | null = null;
    try {
      const response = await baseFetch(
        `/api/public/users/${userId}/tournaments/${tournamentId}/row`
      );
      const rowData: any = parseApiResponse<any>(response);
      pollUntil = rowData.poll_until ? new Date(rowData.poll_until) : null;
    } catch (error) {
      console.warn("Could not fetch polling data:", error);
    }

    // Extract just the metadata from the full tournament
    const { divisions, ...summary } = tournament;
    return { ...summary, pollUntil };
  }

  async listTournaments(): Promise<Domain.TournamentSummary[]> {
    const response = await fetchWithAuth<any[]>("/api/private/tournaments/list");
    return response.map(
      (row: any): Domain.TournamentSummary => ({
        id: row.id,
        name: row.name,
        city: row.city,
        year: row.year,
        lexicon: row.lexicon,
        longFormName: row.long_form_name,
        dataUrl: row.data_url,
        pollUntil: row.poll_until ? new Date(row.poll_until) : null,
      })
    );
  }

  async createTournament(params: any): Promise<any> {
    return await postWithAuth("/api/private/tournaments", params);
  }

  async updateTournament(id: number, params: any): Promise<any> {
    return await putWithAuth(`/api/private/tournaments/${id}`, params);
  }

  async deleteTournament(id: number): Promise<void> {
    await deleteWithAuth(`/api/private/tournaments/${id}`);
  }

  async getDivisions(userId: number, tournamentId: number): Promise<Domain.Division[]> {
    const tournament = await this.getTournament(userId, tournamentId);
    return tournament.divisions;
  }

  async getPlayersForDivision(
    userId: number,
    tournamentId: number,
    divisionName: string
  ): Promise<Domain.Player[]> {
    const tournament = await this.getTournament(userId, tournamentId);
    const division = tournament.divisions.find(
      (d) => d.name === divisionName
    );
    return division ? division.players : [];
  }

  async enablePolling(tournamentId: number, request: StartPollingRequest): Promise<PollingSuccessData> {
    const response = await postWithAuth<PollingSuccessData>(`/api/private/tournaments/${tournamentId}/polling`, request);
    return response;
  }

  async disablePolling(tournamentId: number): Promise<void> {
    await deleteWithAuth(`/api/private/tournaments/${tournamentId}/polling`);
  }

  // ============================================================================
  // CURRENT MATCH SERVICE
  // ============================================================================

  async getCurrentMatch(userId: number): Promise<Domain.CurrentMatch | null> {
    try {
      const response = await baseFetch(`/api/overlay/users/${userId}/match/current`);
      const apiResponse = parseApiResponse<Domain.CurrentMatch>(response);
      return apiResponse;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async setCurrentMatch(request: Domain.CreateCurrentMatch): Promise<Domain.CurrentMatch> {
    const response = await postWithAuth<Domain.CurrentMatch>("/api/admin/match/current", request);
    return response;
  }
}