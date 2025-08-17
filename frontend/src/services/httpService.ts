// frontend/src/services/httpService.ts
// HTTP implementation of the API service interfaces
import {
  LoginRequest,
  LoginSuccessData,
  StartPollingRequest,
  PollingSuccessData,
} from "@shared/types/api";
import * as Domain from "@shared/types/domain";
import { ApiResponse } from "../config/api";

import { 
  baseFetchSafe,
  getAuthHeaders,
} from "../utils/api";
import { ApiService } from "./interfaces";

export class HttpApiService implements ApiService {
  // Helper for authenticated requests
  private async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return await baseFetchSafe<T>(endpoint, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
  }

  // ============================================================================
  // AUTHENTICATION SERVICE
  // ============================================================================

  async login(request: LoginRequest): Promise<ApiResponse<LoginSuccessData>> {
    return await baseFetchSafe<LoginSuccessData>("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }

  // ============================================================================
  // TOURNAMENT SERVICE
  // ============================================================================

  async getTournament(
    userId: number,
    tournamentId: number,
  ): Promise<ApiResponse<Domain.Tournament>> {
    return await baseFetchSafe<Domain.Tournament>(
      `/api/public/v2/users/${userId}/tournaments/${tournamentId}`,
    );
  }

  async getTournamentSummary(
    userId: number,
    tournamentId: number,
  ): Promise<ApiResponse<Domain.TournamentSummary>> {
    // Get the full tournament first
    const tournamentResponse = await this.getTournament(userId, tournamentId);
    if (!tournamentResponse.success) {
      return tournamentResponse as ApiResponse<Domain.TournamentSummary>;
    }

    // Get polling data from the old endpoint (admin-specific data)
    let pollUntil: Date | null = null;
    const pollResponse = await baseFetchSafe<{ poll_until?: string | null }>(
      `/api/public/users/${userId}/tournaments/${tournamentId}/row`,
    );
    if (pollResponse.success && pollResponse.data.poll_until) {
      pollUntil = new Date(pollResponse.data.poll_until);
    }

    // Extract just the metadata from the full tournament
    const { divisions, ...summary } = tournamentResponse.data;
    return { 
      success: true, 
      data: { ...summary, pollUntil } 
    };
  }

  async listTournaments(): Promise<ApiResponse<Domain.TournamentSummary[]>> {
    interface TournamentRow {
      id: number;
      name: string;
      city: string;
      year: number;
      lexicon: string;
      long_form_name: string;
      data_url: string;
      poll_until: string | null;
    }

    const response = await this.fetchWithAuth<TournamentRow[]>("/api/private/tournaments/list");
    if (!response.success) {
      return response as ApiResponse<Domain.TournamentSummary[]>;
    }

    const tournaments = response.data.map(
      (row: TournamentRow): Domain.TournamentSummary => ({
        id: row.id,
        name: row.name,
        city: row.city,
        year: row.year,
        lexicon: row.lexicon,
        longFormName: row.long_form_name,
        dataUrl: row.data_url,
        pollUntil: row.poll_until ? new Date(row.poll_until) : null,
      }),
    );

    return { success: true, data: tournaments };
  }

  async createTournament(params: any): Promise<ApiResponse<any>> {
    return await this.fetchWithAuth("/api/private/tournaments", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async updateTournament(id: number, params: any): Promise<ApiResponse<any>> {
    return await this.fetchWithAuth(`/api/private/tournaments/${id}`, {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }

  async deleteTournament(id: number): Promise<ApiResponse<void>> {
    return await this.fetchWithAuth(`/api/private/tournaments/${id}`, {
      method: "DELETE",
    });
  }

  async getDivisions(
    userId: number,
    tournamentId: number,
  ): Promise<ApiResponse<Domain.Division[]>> {
    const tournamentResponse = await this.getTournament(userId, tournamentId);
    if (!tournamentResponse.success) {
      return tournamentResponse as ApiResponse<Domain.Division[]>;
    }

    return { 
      success: true, 
      data: tournamentResponse.data.divisions 
    };
  }

  async getPlayersForDivision(
    userId: number,
    tournamentId: number,
    divisionName: string,
  ): Promise<ApiResponse<Domain.Player[]>> {
    const tournamentResponse = await this.getTournament(userId, tournamentId);
    if (!tournamentResponse.success) {
      return tournamentResponse as ApiResponse<Domain.Player[]>;
    }

    const division = tournamentResponse.data.divisions.find((d) => d.name === divisionName);
    return { 
      success: true, 
      data: division ? division.players : [] 
    };
  }

  async enablePolling(
    tournamentId: number,
    request: StartPollingRequest,
  ): Promise<ApiResponse<PollingSuccessData>> {
    return await this.fetchWithAuth(`/api/private/tournaments/${tournamentId}/polling`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async disablePolling(tournamentId: number): Promise<ApiResponse<void>> {
    return await this.fetchWithAuth(`/api/private/tournaments/${tournamentId}/polling`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // CURRENT MATCH SERVICE
  // ============================================================================

  async getCurrentMatch(userId: number): Promise<ApiResponse<Domain.CurrentMatch | null>> {
    const response = await baseFetchSafe<Domain.CurrentMatch>(
      `/api/overlay/users/${userId}/match/current`,
    );
    
    // Handle 404 as success with null data (no current match)
    if (!response.success && response.error.includes("404")) {
      return { success: true, data: null };
    }
    
    return response as ApiResponse<Domain.CurrentMatch | null>;
  }

  async setCurrentMatch(
    request: Domain.CreateCurrentMatch,
  ): Promise<ApiResponse<Domain.CurrentMatch>> {
    return await this.fetchWithAuth("/api/admin/match/current", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }
}
