// WorkerSocketManager.ts - Enhanced SocketManager using TournamentCacheManager with incremental updates
import {
  AdminPanelUpdateMessage,
  GamesAddedMessage,
  Ping,
  TournamentThemeChangedMessage,
} from "@shared/types/websocket";
import io, { Socket } from "socket.io-client";

import { API_BASE } from "../config/api";
import { ApiService } from "../services/interfaces";
import {
  SubscribeMessage,
  TournamentDataResponse,
  TournamentDataRefresh,
  TournamentDataIncremental,
  TournamentDataError,
  BroadcastMessage,
} from "../types/broadcast";
import TournamentCacheManager from "./TournamentCacheManager";

class WorkerSocketManager {
  private static instance: WorkerSocketManager;
  private socket: Socket | null = null;
  private connectionStatus: string = "Initializing...";
  private error: string | null = null;
  private lastDataUpdate: number = Date.now();

  private broadcastChannel: BroadcastChannel;
  private statusChannel: BroadcastChannel;
  private cacheManager: TournamentCacheManager;
  private apiService: ApiService | null = null;

  // Message deduplication - track highest timestamp seen
  private lastSeenTimestamp: number = 0;
  private statusBroadcastInterval: NodeJS.Timeout | null = null;

  private constructor() {
    console.log(
      "🔧 WorkerSocketManager constructor called - creating instance",
    );
    this.broadcastChannel = new BroadcastChannel("tournament-updates");
    this.statusChannel = new BroadcastChannel("worker-status");
    this.cacheManager = TournamentCacheManager.getInstance();
    this.connectSocket();
    this.setupBroadcastListener();
    this.startStatusBroadcasting();
  }

  private startStatusBroadcasting() {
    // Broadcast status every second
    this.statusBroadcastInterval = setInterval(() => {
      this.broadcastStatus();
    }, 1000);
  }

  static getInstance(apiService?: ApiService): WorkerSocketManager {
    if (!WorkerSocketManager.instance) {
      WorkerSocketManager.instance = new WorkerSocketManager();
    }
    if (apiService && !WorkerSocketManager.instance.apiService) {
      WorkerSocketManager.instance.apiService = apiService;
    }
    return WorkerSocketManager.instance;
  }

  private withDeduplication<T extends { timestamp?: number }>(
    eventType: string,
    handler: (data: T) => void,
  ): void {
    if (!this.socket) return;

    this.socket.on(eventType, (data: T) => {
      if (this.shouldSkipDuplicateMessage(data, eventType)) {
        return;
      }
      handler(data);
    });
  }

  // Check and skip duplicate WebSocket messages
  private shouldSkipDuplicateMessage(
    data: { timestamp?: number },
    eventType: string,
  ): boolean {
    if (!data.timestamp) {
      console.warn(`⚠️ ${eventType} message missing timestamp`);
      return false; // Process messages without timestamp
    }

    if (data.timestamp <= this.lastSeenTimestamp) {
      console.log(
        `⏭️ Skipping duplicate/old ${eventType} message: timestamp ${data.timestamp} (last seen: ${this.lastSeenTimestamp})`,
      );
      return true;
    }

    // Update highest seen timestamp
    this.lastSeenTimestamp = data.timestamp;
    console.log(
      `✅ Processing ${eventType} message: timestamp ${data.timestamp}`,
    );
    return false;
  }

  private setupBroadcastListener() {
    this.broadcastChannel.onmessage = (event) => {
      const { type, data } = event.data;

      console.log(`📥 Worker received broadcast message: ${type}`, data);

      switch (type) {
        case "SUBSCRIBE":
          this.handleSubscribeMessage(data as SubscribeMessage);
          break;
        default:
          console.log(
            `⚠️ Worker received unknown broadcast message type: ${type}`,
          );
      }
    };
  }

  private async handleSubscribeMessage(data: SubscribeMessage) {
    const { userId, tournamentId, divisionId, divisionName } = data;

    // Validate that at least one division identifier is provided
    if (!divisionId && !divisionName) {
      console.error(`❌ Worker SUBSCRIBE request missing divisionId AND divisionName - cannot proceed`);
      const errorMessage: TournamentDataError = {
        userId,
        tournamentId,
        error: "Must provide either divisionId or divisionName",
      };
      this.broadcastMessage({
        type: "TOURNAMENT_DATA_ERROR",
        data: errorMessage,
      });
      return;
    }

    console.log(
      `🔔 Worker handling SUBSCRIBE request: user ${userId}, tournament ${tournamentId}, division ${divisionId || `"${divisionName}"`}`,
    );

    // Check cache first - worker still caches FULL tournament for efficiency
    let cachedData = this.cacheManager.get(userId, tournamentId);

    // If not in cache, fetch full tournament and cache it
    if (!cachedData) {
      try {
        console.log(
          `🔄 Worker fetching full tournament data for tournament ${tournamentId}...`,
        );
        if (!this.apiService) {
          throw new Error("API service not initialized");
        }
        const response = await this.apiService.getTournament(
          userId,
          tournamentId,
        );
        if (!response.success) {
          throw new Error(response.error);
        }
        cachedData = response.data;

        // Cache the full tournament data
        this.cacheManager.set(userId, tournamentId, cachedData);
        console.log(`✅ Worker cached full tournament ${tournamentId}`);
      } catch (error) {
        console.error(
          `🔴 Worker failed to fetch tournament data for SUBSCRIBE request: user ${userId}, tournament ${tournamentId}:`,
          error,
        );

        const errorMessage: TournamentDataError = {
          userId,
          tournamentId,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch tournament data",
        };
        this.broadcastMessage({
          type: "TOURNAMENT_DATA_ERROR",
          data: errorMessage,
        });
        return;
      }
    } else {
      console.log(`💾 Worker found cached data for tournament ${tournamentId}`);
    }

    // Extract division-scoped data from full tournament
    const divisionScopedData = this.extractDivisionScopedData(
      cachedData,
      divisionId,
      divisionName,
    );

    if (!divisionScopedData) {
      const errorMessage: TournamentDataError = {
        userId,
        tournamentId,
        error: `Division ${divisionId || divisionName} not found in tournament`,
      };
      this.broadcastMessage({
        type: "TOURNAMENT_DATA_ERROR",
        data: errorMessage,
      });
      return;
    }

    const message: TournamentDataResponse = {
      userId,
      tournamentId,
      divisionId: divisionScopedData.division.id,
      data: divisionScopedData,
    };

    console.log(
      `📢 Worker broadcasting division-scoped TOURNAMENT_DATA_RESPONSE for user ${userId}, tournament ${tournamentId}, division ${divisionScopedData.division.name} (id: ${divisionScopedData.division.id})`,
    );
    this.broadcastMessage({
      type: "TOURNAMENT_DATA_RESPONSE",
      data: message,
    });
  }

  // Helper: Extract division-scoped data from full tournament
  private extractDivisionScopedData(
    fullTournament: import("@shared/types/domain").Tournament,
    divisionId?: number,
    divisionName?: string,
  ): import("../types/broadcast").DivisionScopedData | null {
    // Find the division
    let division: import("@shared/types/domain").Division | undefined;
    if (divisionId) {
      division = fullTournament.divisions.find((d) => d.id === divisionId);
    } else if (divisionName) {
      division = fullTournament.divisions.find(
        (d) => d.name.toUpperCase() === divisionName.toUpperCase(),
      );
    }

    if (!division) {
      console.error(
        `❌ Division ${divisionId || divisionName} not found in tournament ${fullTournament.id}`,
      );
      return null;
    }

    // Extract tournament metadata (without divisions array)
    const tournamentMetadata: import("../types/broadcast").TournamentMetadata = {
      id: fullTournament.id,
      name: fullTournament.name,
      city: fullTournament.city,
      year: fullTournament.year,
      lexicon: fullTournament.lexicon,
      longFormName: fullTournament.longFormName,
      dataUrl: fullTournament.dataUrl,
      theme: fullTournament.theme,
      transparentBackground: fullTournament.transparentBackground,
    };

    console.log(
      `✂️ Worker extracted division-scoped data: ${division.name} with ${division.players.length} players, ${division.games.length} games`,
    );

    return {
      tournament: tournamentMetadata,
      division,
    };
  }

  private connectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      console.log("🔌 Worker connecting to WebSocket");
      this.socket = io(API_BASE, {
        transports: ["polling", "websocket"],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        withCredentials: true,
      });

      this.socket.on("connect", () => {
        console.log("🟢 Worker Socket connected");
        this.connectionStatus = "Connected to server";
        this.error = null;
        this.lastDataUpdate = Date.now();
        this.broadcastStatus();
      });

      this.socket.on("connect_error", (error: Error) => {
        console.error("🔴 Worker Socket connect error:", error);
        this.connectionStatus = `Connection error: ${error.message}`;
        this.broadcastStatus();
      });

      this.socket.on("disconnect", (reason: string) => {
        console.log("🟡 Worker Socket disconnected:", reason);
        this.connectionStatus = `Disconnected from server: ${reason}`;
        // Reset timestamp counter on disconnect to handle reconnection cleanly
        this.lastSeenTimestamp = 0;
        console.log("🔄 Reset lastSeenTimestamp on disconnect");
        this.broadcastStatus();
      });

      this.socket.on("error", (error: Error) => {
        console.error("🔴 Worker Socket error:", error);
        this.error = `Socket error: ${error.message}`;
        this.broadcastStatus();
      });

      this.socket.on("ping", () => {
        console.log("got a ping!");
        this.lastDataUpdate = Date.now();
      });

      this.withDeduplication("Ping", (data: Ping) => {
        console.log(`🏓 Worker received ping`, data);
        this.lastDataUpdate = Date.now();
        this.broadcastWebSocketMessage("Ping", data);
        // Ping is just for keep-alive - no need to broadcast to overlays
      });

      // Set up tournament event handlers
      this.setupTournamentEventHandlers();
    } catch (error) {
      const err = error as Error;
      console.error("🔴 Worker Socket initialization error:", err);
      this.error = `Socket initialization failed: ${err.message}`;
      this.connectionStatus = `Failed to initialize socket connection`;
    }
  }

  private setupTournamentEventHandlers() {
    if (!this.socket) return;

    this.withDeduplication(
      "AdminPanelUpdate",
      (data: AdminPanelUpdateMessage) => {
        console.log("📡 Worker received AdminPanelUpdate:", data);
        this.broadcastWebSocketMessage("AdminPanelUpdate", data);
        this.broadcastMessage({
          type: "ADMIN_PANEL_UPDATE",
          data: data,
        });
        // Admin panel changes always require full refresh (new tournament selected)
        this.fetchAndBroadcastTournamentRefresh(data.tournamentId, data.userId);
      },
    );

    this.withDeduplication("tournament-theme-changed", (data: TournamentThemeChangedMessage) => {
      // Broadcast the theme change message
      this.broadcastWebSocketMessage("TournamentThemeChanged", {
        ...data,
        timestamp: data.timestamp || Date.now(),
      });

      // Refresh the tournament data to get the new theme
      // The theme change affects the tournament metadata
      this.fetchAndBroadcastTournamentRefresh(data.tournamentId, data.userId);
    });

    this.withDeduplication("GamesAdded", (data: GamesAddedMessage) => {
      console.log("📡 Worker received GamesAdded:", data);
      console.log(
        `📊 Changes summary: ${this.cacheManager.getChangesSummary(data.update.changes)}`,
      );

      this.broadcastWebSocketMessage("GamesAdded", data);

      // Apply incremental changes to cache
      const success = this.cacheManager.applyTournamentUpdate(
        data.userId,
        data.tournamentId,
        data.update,
      );

      if (success) {
        // Broadcast incremental update
        // NOTE: We no longer send previousData to reduce message size by ~50%
        // This was only used by notification detectors (not in production)
        // When implementing notifications, consider pre-calculating needed metadata
        // instead of sending full previous state
        this.broadcastTournamentIncremental(
          data.userId,
          data.tournamentId,
          data.update,
        );
      } else {
        // Fallback to full refresh if cache update failed
        console.warn("⚠️ Cache update failed, falling back to full refresh");
        this.fetchAndBroadcastTournamentRefresh(data.tournamentId, data.userId);
      }
    });

    this.withDeduplication("cache-clear-requested", (data: { userId: number; timestamp?: number }) => {
      console.log("🧹 Worker received cache-clear-requested:", data);
      
      // Clear the tournament cache
      this.cacheManager.clear();
      console.log("💾 Worker cleared tournament cache");
      
      this.broadcastWebSocketMessage("CacheClearRequested", data);
      
      // Broadcast cache clear event for debugging
      this.broadcastMessage({
        type: "CACHE_CLEARED",
        data: {
          clearedBy: data.userId,
          timestamp: data.timestamp || Date.now(),
        },
      });
    });
  }

  // New method to broadcast incremental tournament updates
  // Now broadcasts one division-scoped message PER affected division
  private broadcastTournamentIncremental(
    userId: number,
    tournamentId: number,
    update: import("@shared/types/domain").TournamentUpdate,
  ) {
    const affectedDivisions = this.cacheManager.getAffectedDivisions(
      update.changes,
    );

    // Get updated tournament data from cache (after changes applied)
    const updatedTournamentData = this.cacheManager.get(userId, tournamentId);

    if (!updatedTournamentData) {
      console.error(
        "🔴 Cannot broadcast incremental update - no cached data found",
      );
      return;
    }

    console.log(
      `📢 Worker broadcasting TOURNAMENT_DATA_INCREMENTAL for ${affectedDivisions.length} affected division(s):`,
      affectedDivisions,
    );

    // Broadcast one message per affected division
    for (const divisionId of affectedDivisions) {
      const updatedDivisionData = this.extractDivisionScopedData(
        updatedTournamentData,
        divisionId,
      );

      if (!updatedDivisionData) {
        console.error(
          `⚠️ Cannot extract division ${divisionId} from updated tournament - skipping`,
        );
        continue;
      }

      const message: TournamentDataIncremental = {
        userId,
        tournamentId,
        divisionId, // Now required - identifies which division this update is for
        data: updatedDivisionData, // Division-scoped data
        // previousData removed to reduce message size by ~50% (only used by notifications)
        changes: update.changes, // What changed (still full changes for notifications)
        affectedDivisions, // Keep for reference (notifications might care about other divisions)
        metadata: {
          addedCount: update.changes.added.length,
          updatedCount: update.changes.updated.length,
          timestamp: Date.now(),
        },
        reason: "games_added",
      };

      console.log(
        `  📤 Broadcasting update for division ${divisionId} (${updatedDivisionData.division.name}):`,
        `${message.metadata.addedCount} added, ${message.metadata.updatedCount} updated`,
      );

      this.broadcastMessage({
        type: "TOURNAMENT_DATA_INCREMENTAL",
        data: message,
      });
    }
  }

  // Type-safe broadcast method - only accepts proper BroadcastMessage types
  private broadcastMessage(message: BroadcastMessage) {
    console.log(`📢 Worker broadcasting ${message.type}:`, message.data);
    this.broadcastChannel.postMessage(message);

    // Also broadcast to status channel for debugging
    this.statusChannel.postMessage({
      type: "BROADCAST_MESSAGE",
      data: {
        messageType: message.type,
        data: message.data,
        timestamp: Date.now(),
      },
    });
  }

  private async fetchAndBroadcastTournamentRefresh(
    tournamentId: number,
    userId: number,
    specificDivisionId?: number, // Optional: refresh only a specific division
  ) {
    try {
      console.log(
        `🔄 Worker fetching full tournament data for refresh: user ${userId}, tournament ID: ${tournamentId}`,
      );
      if (!this.apiService) {
        throw new Error("API service not initialized");
      }
      const response = await this.apiService.getTournament(
        userId,
        tournamentId,
      );
      if (!response.success) {
        throw new Error(response.error);
      }
      const tournamentData = response.data;

      // Update cache
      this.cacheManager.set(userId, tournamentId, tournamentData);

      // Determine which divisions to broadcast
      const divisionsToRefresh = specificDivisionId
        ? [specificDivisionId]
        : tournamentData.divisions.map((d) => d.id);

      console.log(
        `📢 Worker broadcasting TOURNAMENT_DATA_REFRESH for ${divisionsToRefresh.length} division(s)`,
      );

      // Broadcast one refresh message per division
      for (const divisionId of divisionsToRefresh) {
        const divisionScopedData = this.extractDivisionScopedData(
          tournamentData,
          divisionId,
        );

        if (!divisionScopedData) {
          console.error(
            `⚠️ Cannot extract division ${divisionId} from tournament - skipping refresh`,
          );
          continue;
        }

        const message: TournamentDataRefresh = {
          userId,
          tournamentId,
          divisionId,
          data: divisionScopedData,
          reason: "admin_panel_update",
        };

        console.log(
          `  📤 Broadcasting refresh for division ${divisionId} (${divisionScopedData.division.name})`,
        );
        this.broadcastMessage({
          type: "TOURNAMENT_DATA_REFRESH",
          data: message,
        });
      }
    } catch (error) {
      console.error(
        `🔴 Worker failed to fetch tournament data for refresh: user ${userId}, tournament ${tournamentId}:`,
        error,
      );
      // Broadcast error so display sources know something went wrong
      const errorMessage: TournamentDataError = {
        userId,
        tournamentId,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch tournament data",
      };
      this.broadcastMessage({
        type: "TOURNAMENT_DATA_ERROR",
        data: errorMessage,
      });
    }
  }

  // Broadcast status updates via status channel
  private broadcastStatus() {
    this.statusChannel.postMessage({
      type: "WORKER_STATUS_UPDATE",
      data: {
        status: this.connectionStatus,
        error: this.error,
        lastDataUpdate: this.lastDataUpdate,
        cacheStats: this.cacheManager.getStats(),
      },
    });
  }

  // Broadcast incoming WebSocket messages for debugging
  private broadcastWebSocketMessage(eventType: string, data: unknown) {
    this.statusChannel.postMessage({
      type: "WEBSOCKET_MESSAGE",
      data: {
        eventType,
        data,
        timestamp: Date.now(),
      },
    });
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  getError(): string | null {
    return this.error;
  }

  getLastDataUpdate(): number {
    return this.lastDataUpdate;
  }

  // Method to get last seen timestamp (useful for debugging)
  getLastSeenTimestamp(): number {
    return this.lastSeenTimestamp;
  }

  // Method to reset timestamp counter (useful for testing)
  resetTimestampCounter(): void {
    this.lastSeenTimestamp = 0;
    console.log("🔄 Manually reset lastSeenTimestamp");
  }

  // Get cache stats for debugging
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  // Cleanup method
  cleanup() {
    console.log("🧹 Worker cleaning up...");
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.statusBroadcastInterval) {
      clearInterval(this.statusBroadcastInterval);
    }
    this.broadcastChannel.close();
    this.statusChannel.close();
    this.lastSeenTimestamp = 0;
    this.cacheManager.clear();
    console.log("💾 Worker cleared tournament cache");
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  WorkerSocketManager.getInstance().cleanup();
});

export default WorkerSocketManager;
