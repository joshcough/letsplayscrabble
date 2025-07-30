// WorkerSocketManager.ts - Enhanced SocketManager for the worker thread
import io, { Socket } from "socket.io-client";
import { API_BASE } from "../config/api";
import {
  AdminPanelUpdateMessage,
  GamesAddedMessage,
  Ping,
} from "@shared/types/websocket";
import { fetchTournament } from "../utils/api";

class WorkerSocketManager {
  private static instance: WorkerSocketManager;
  private socket: Socket | null = null;
  private connectionStatus: string = "Initializing...";
  private error: string | null = null;
  private lastDataUpdate: number = Date.now();
  private listeners: Set<(data: any) => void> = new Set();

  private broadcastChannel: BroadcastChannel;

  // Message deduplication - track highest messageId seen
  private lastSeenMessageId: number = 0;

  private constructor() {
    console.log(
      "🔧 WorkerSocketManager constructor called - creating instance",
    );
    this.broadcastChannel = new BroadcastChannel("tournament-updates");
    this.connectSocket();
  }

  static getInstance(): WorkerSocketManager {
    if (!WorkerSocketManager.instance) {
      WorkerSocketManager.instance = new WorkerSocketManager();
    }
    return WorkerSocketManager.instance;
  }

  private withDeduplication<T extends { messageId?: number }>(
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
    data: { messageId?: number },
    eventType: string,
  ): boolean {
    if (!data.messageId) {
      console.warn(`⚠️ ${eventType} message missing messageId`);
      return false; // Process messages without messageId
    }

    if (data.messageId <= this.lastSeenMessageId) {
      console.log(
        `⏭️ Skipping duplicate/old ${eventType} message: messageId ${data.messageId} (last seen: ${this.lastSeenMessageId})`,
      );
      return true;
    }

    // Update highest seen messageId
    this.lastSeenMessageId = data.messageId;
    console.log(
      `✅ Processing ${eventType} message: messageId ${data.messageId}`,
    );
    return false;
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
        // Reset messageId counter on disconnect to handle reconnection cleanly
        this.lastSeenMessageId = 0;
        console.log("🔄 Reset lastSeenMessageId on disconnect");
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
        this.broadcastToDisplayOverlays("Ping", data);
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
        this.broadcastToDisplayOverlays("AdminPanelUpdate", data);
        this.fetchAndBroadcastTournamentData(data.tournamentId, data.userId);
      },
    );

    this.withDeduplication("GamesAdded", (data: GamesAddedMessage) => {
      console.log("📡 Worker received GamesAdded:", data);
      this.broadcastToDisplayOverlays("GamesAdded", data);
      this.fetchAndBroadcastTournamentData(data.tournamentId, data.userId);
    });
  }

  private broadcastToDisplayOverlays(eventType: string, data: any) {
    const message = {
      type: eventType,
      data: data,
      timestamp: Date.now(),
    };

    console.log(
      `📢 Worker broadcasting ${eventType} to display sources:`,
      message,
    );
    this.broadcastChannel.postMessage(message);
  }

  private async fetchAndBroadcastTournamentData(
    tournamentId: number,
    userId: number,
  ) {
    try {
      console.log(
        `🔄 Worker fetching tournament data for user ${userId}, tournament ID: ${tournamentId}`,
      );
      const tournamentData = await fetchTournament(userId, tournamentId);

      const message = {
        type: "TOURNAMENT_DATA",
        tournamentId: tournamentId,
        userId: userId,
        data: tournamentData,
        timestamp: Date.now(),
      };

      console.log(
        `📢 Worker broadcasting TOURNAMENT_DATA for user ${userId}, tournament ${tournamentId}:`,
        message,
      );
      this.broadcastChannel.postMessage(message);
    } catch (error) {
      console.error(
        `🔴 Worker failed to fetch tournament data for user ${userId}, tournament ${tournamentId}:`,
        error,
      );
      // Broadcast error so display sources know something went wrong
      const errorMessage = {
        type: "TOURNAMENT_DATA_ERROR",
        tournamentId: tournamentId,
        userId: userId,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch tournament data",
        timestamp: Date.now(),
      };
      this.broadcastChannel.postMessage(errorMessage);
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

  // Method to get last seen messageId (useful for debugging)
  getLastSeenMessageId(): number {
    return this.lastSeenMessageId;
  }

  // Method to reset messageId counter (useful for testing)
  resetMessageIdCounter(): void {
    this.lastSeenMessageId = 0;
    console.log("🔄 Manually reset lastSeenMessageId");
  }

  // Cleanup method
  cleanup() {
    console.log("🧹 Worker cleaning up...");
    if (this.socket) {
      this.socket.disconnect();
    }
    this.broadcastChannel.close();
    this.lastSeenMessageId = 0;
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  WorkerSocketManager.getInstance().cleanup();
});

export default WorkerSocketManager;
