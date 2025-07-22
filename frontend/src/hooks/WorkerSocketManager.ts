// WorkerSocketManager.ts - Enhanced SocketManager for the worker thread
import io, { Socket } from "socket.io-client";
import { API_BASE } from "../config/api";
import { CurrentMatch } from "@shared/types/currentMatch";
import { fetchTournament } from "../utils/tournamentApi";

class WorkerSocketManager {
  private static instance: WorkerSocketManager;
  private socket: Socket | null = null;
  private connectionStatus: string = "Initializing...";
  private error: string | null = null;
  private lastDataUpdate: number = Date.now();
  private listeners: Set<(data: any) => void> = new Set();

  // Broadcast channel for communicating with display sources
  private broadcastChannel: BroadcastChannel;

  private constructor() {
    console.log("🔧 WorkerSocketManager initializing...");
    this.broadcastChannel = new BroadcastChannel('tournament-updates');
    this.connectSocket();
  }

  static getInstance(): WorkerSocketManager {
    if (!WorkerSocketManager.instance) {
      WorkerSocketManager.instance = new WorkerSocketManager();
    }
    return WorkerSocketManager.instance;
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
        this.notifyListeners({ type: 'statusChange', status: this.connectionStatus });
      });

      this.socket.on("connect_error", (error: Error) => {
        console.error("🔴 Worker Socket connect error:", error);
        this.connectionStatus = `Connection error: ${error.message}`;
        this.notifyListeners({ type: 'statusChange', status: this.connectionStatus });
      });

      this.socket.on("disconnect", (reason: string) => {
        console.log("🟡 Worker Socket disconnected:", reason);
        this.connectionStatus = `Disconnected from server: ${reason}`;
        this.notifyListeners({ type: 'statusChange', status: this.connectionStatus });
      });

      this.socket.on("error", (error: Error) => {
        console.error("🔴 Worker Socket error:", error);
        this.error = `Socket error: ${error.message}`;
        this.notifyListeners({ type: 'error', error: this.error });
      });

      this.socket.on("ping", () => {
        this.lastDataUpdate = Date.now();
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

    // Listen for AdminPanelUpdate and broadcast to display sources
    this.socket.on("AdminPanelUpdate", (data: CurrentMatch) => {
      console.log("📡 Worker received AdminPanelUpdate:", data);
      this.broadcastToDisplaySources("AdminPanelUpdate", data);
      // Also fetch and broadcast tournament data for the current match
      this.fetchAndBroadcastTournamentData(data.tournament_id);
    });

    // Listen for GamesAdded and broadcast to display sources
    this.socket.on("GamesAdded", (data: { tournamentId: number }) => {
      console.log("📡 Worker received GamesAdded:", data);
      this.broadcastToDisplaySources("GamesAdded", data);
      // Fetch and broadcast updated tournament data
      this.fetchAndBroadcastTournamentData(data.tournamentId);
    });
  }

  private broadcastToDisplaySources(eventType: string, data: any) {
    const message = {
      type: eventType,
      data: data,
      timestamp: Date.now()
    };

    console.log(`📢 Worker broadcasting ${eventType} to display sources:`, message);
    this.broadcastChannel.postMessage(message);
  }

  private async fetchAndBroadcastTournamentData(tournamentId: number) {
    try {
      console.log(`🔄 Worker fetching tournament data for ID: ${tournamentId}`);
      const tournamentData = await fetchTournament(tournamentId);

      const message = {
        type: 'TOURNAMENT_DATA',
        tournamentId: tournamentId,
        data: tournamentData,
        timestamp: Date.now()
      };

      console.log(`📢 Worker broadcasting TOURNAMENT_DATA for tournament ${tournamentId}:`, message);
      this.broadcastChannel.postMessage(message);
    } catch (error) {
      console.error(`🔴 Worker failed to fetch tournament data for ${tournamentId}:`, error);
      // Broadcast error so display sources know something went wrong
      const errorMessage = {
        type: 'TOURNAMENT_DATA_ERROR',
        tournamentId: tournamentId,
        error: error instanceof Error ? error.message : 'Failed to fetch tournament data',
        timestamp: Date.now()
      };
      this.broadcastChannel.postMessage(errorMessage);
    }
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
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

  // Cleanup method
  cleanup() {
    console.log("🧹 Worker cleaning up...");
    if (this.socket) {
      this.socket.disconnect();
    }
    this.broadcastChannel.close();
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  WorkerSocketManager.getInstance().cleanup();
});

export default WorkerSocketManager;