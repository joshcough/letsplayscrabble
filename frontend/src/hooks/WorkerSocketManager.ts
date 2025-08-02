// WorkerSocketManager.ts - Enhanced SocketManager for the worker thread
import {
  AdminPanelUpdateMessage,
  GamesAddedMessage,
  Ping,
} from "@shared/types/websocket";
import {
  SubscribeMessage,
  TournamentDataResponse,
  TournamentDataRefresh,
  TournamentDataError,
  BroadcastMessage,
} from "@shared/types/broadcast";
import io, { Socket } from "socket.io-client";

import { API_BASE } from "../config/api";
import { fetchTournament } from "../utils/api";

class WorkerSocketManager {
  private static instance: WorkerSocketManager;
  private socket: Socket | null = null;
  private connectionStatus: string = "Initializing...";
  private error: string | null = null;
  private lastDataUpdate: number = Date.now();
  private listeners: Set<(data: any) => void> = new Set();

  private broadcastChannel: BroadcastChannel;

  // Cache for tournament data - keyed by "userId:tournamentId" (always full tournament)
  private tournamentCache = new Map<string, any>();

  // Message deduplication - track highest timestamp seen
  private lastSeenTimestamp: number = 0;

  private constructor() {
    console.log(
      "🔧 WorkerSocketManager constructor called - creating instance",
    );
    this.broadcastChannel = new BroadcastChannel("tournament-updates");
    this.connectSocket();
    this.setupBroadcastListener();
  }

  static getInstance(): WorkerSocketManager {
    if (!WorkerSocketManager.instance) {
      WorkerSocketManager.instance = new WorkerSocketManager();
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
        case 'SUBSCRIBE':
          this.handleSubscribeMessage(data as SubscribeMessage);
          break;
        default:
          console.log(`⚠️ Worker received unknown broadcast message type: ${type}`);
      }
    };
  }

  private getCacheKey(userId: number, tournamentId: number): string {
    return `${userId}:${tournamentId}`;
  }

  private async handleSubscribeMessage(data: SubscribeMessage) {
    const { userId, tournamentId, divisionId } = data;
    const cacheKey = this.getCacheKey(userId, tournamentId);

    console.log(
      `🔔 Worker handling SUBSCRIBE request: user ${userId}, tournament ${tournamentId}${divisionId ? `, division ${divisionId} (will fetch full tournament)` : ' (full tournament)'}`
    );

    // Check cache first
    if (this.tournamentCache.has(cacheKey)) {
      console.log(`💾 Worker found cached data for ${cacheKey} - broadcasting immediately`);

      const cachedData = this.tournamentCache.get(cacheKey);
      const message: TournamentDataResponse = {
        userId: userId,
        tournamentId: tournamentId,
        data: cachedData,
      };

      console.log(
        `📢 Worker broadcasting cached TOURNAMENT_DATA_RESPONSE for user ${userId}, tournament ${tournamentId}`,
      );
      this.broadcastMessage({
        type: "TOURNAMENT_DATA_RESPONSE",
        data: message,
      });
      return;
    }

    // Not in cache - fetch full tournament and cache
    try {
      console.log(`🔄 Worker fetching full tournament data for tournament ${tournamentId}...`);
      const tournamentData = await fetchTournament(userId, tournamentId);

      // Cache the data
      this.tournamentCache.set(cacheKey, tournamentData);
      console.log(`💾 Worker cached full tournament data for ${cacheKey}`);

      const message: TournamentDataResponse = {
        userId: userId,
        tournamentId: tournamentId,
        data: tournamentData,
      };

      console.log(
        `📢 Worker broadcasting fresh TOURNAMENT_DATA_RESPONSE for user ${userId}, tournament ${tournamentId}`,
      );
      this.broadcastMessage({
        type: "TOURNAMENT_DATA_RESPONSE",
        data: message,
      });

    } catch (error) {
      console.error(
        `🔴 Worker failed to fetch tournament data for SUBSCRIBE request: user ${userId}, tournament ${tournamentId}:`,
        error,
      );

      // Broadcast error so display sources know something went wrong
      const errorMessage: TournamentDataError = {
        userId: userId,
        tournamentId: tournamentId,
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
        this.notifyListeners({
          type: "statusChange",
          status: this.connectionStatus,
        });
      });

      this.socket.on("connect_error", (error: Error) => {
        console.error("🔴 Worker Socket connect error:", error);
        this.connectionStatus = `Connection error: ${error.message}`;
        this.notifyListeners({
          type: "statusChange",
          status: this.connectionStatus,
        });
      });

      this.socket.on("disconnect", (reason: string) => {
        console.log("🟡 Worker Socket disconnected:", reason);
        this.connectionStatus = `Disconnected from server: ${reason}`;
        // Reset timestamp counter on disconnect to handle reconnection cleanly
        this.lastSeenTimestamp = 0;
        console.log("🔄 Reset lastSeenTimestamp on disconnect");
        this.notifyListeners({
          type: "statusChange",
          status: this.connectionStatus,
        });
      });

      this.socket.on("error", (error: Error) => {
        console.error("🔴 Worker Socket error:", error);
        this.error = `Socket error: ${error.message}`;
        this.notifyListeners({ type: "error", error: this.error });
      });

      this.socket.on("ping", () => {
        console.log("got a ping!");
        this.lastDataUpdate = Date.now();
      });

      this.withDeduplication("Ping", (data: Ping) => {
        console.log(`🏓 Worker received ping`, data);
        this.lastDataUpdate = Date.now();
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
        // Process internally - fetch fresh tournament data and broadcast refresh
        this.fetchAndBroadcastTournamentRefresh(data.tournamentId, data.userId);
      },
    );

    this.withDeduplication("GamesAdded", (data: GamesAddedMessage) => {
      console.log("📡 Worker received GamesAdded:", data);
      // TODO: Implement incremental updates using data.update.changes
      // For now, treat as refresh until incremental updates are implemented
      this.fetchAndBroadcastTournamentRefresh(
        data.update.tournament.id,
        data.update.tournament.user_id,
      );
    });
  }

  // Type-safe broadcast method - only accepts proper BroadcastMessage types
  private broadcastMessage(message: BroadcastMessage) {
    console.log(`📢 Worker broadcasting ${message.type}:`, message.data);
    this.broadcastChannel.postMessage(message);
  }

  private async fetchAndBroadcastTournamentRefresh(
    tournamentId: number,
    userId: number,
  ) {
    const cacheKey = this.getCacheKey(userId, tournamentId);

    try {
      console.log(
        `🔄 Worker fetching full tournament data for refresh: user ${userId}, tournament ID: ${tournamentId}`,
      );
      const tournamentData = await fetchTournament(userId, tournamentId);

      // Update cache
      this.tournamentCache.set(cacheKey, tournamentData);
      console.log(`💾 Worker updated cache for ${cacheKey} after WebSocket event`);

      const message: TournamentDataRefresh = {
        userId: userId,
        tournamentId: tournamentId,
        data: tournamentData,
        reason: 'admin_panel_update',
      };

      console.log(
        `📢 Worker broadcasting TOURNAMENT_DATA_REFRESH for user ${userId}, tournament ${tournamentId}`,
      );
      this.broadcastMessage({
        type: "TOURNAMENT_DATA_REFRESH",
        data: message,
      });
    } catch (error) {
      console.error(
        `🔴 Worker failed to fetch tournament data for refresh: user ${userId}, tournament ${tournamentId}:`,
        error,
      );
      // Broadcast error so display sources know something went wrong
      const errorMessage: TournamentDataError = {
        userId: userId,
        tournamentId: tournamentId,
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

  private notifyListeners(data: any) {
    this.listeners.forEach((listener) => listener(data));
  }

  addListener(listener: (data: any) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (data: any) => void) {
    this.listeners.delete(listener);
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

  // Cleanup method
  cleanup() {
    console.log("🧹 Worker cleaning up...");
    if (this.socket) {
      this.socket.disconnect();
    }
    this.broadcastChannel.close();
    this.lastSeenTimestamp = 0;
    this.tournamentCache.clear();
    console.log("💾 Worker cleared tournament cache");
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  WorkerSocketManager.getInstance().cleanup();
});

export default WorkerSocketManager;