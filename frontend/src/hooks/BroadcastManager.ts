// BroadcastManager.t
import {
  AdminPanelUpdateMessage,
  GamesAddedMessage,
  TournamentDataMessage,
  TournamentDataErrorMessage,
  Ping,
} from "@shared/types/websocket";

type EventHandler = (data: any) => void;

class BroadcastManager {
  private static instance: BroadcastManager;
  private broadcastChannel: BroadcastChannel;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  private constructor() {
    console.log("📺 BroadcastManager initializing...");
    this.broadcastChannel = new BroadcastChannel("tournament-updates");
    this.setupBroadcastListener();
  }

  static getInstance(): BroadcastManager {
    if (!BroadcastManager.instance) {
      BroadcastManager.instance = new BroadcastManager();
    }
    return BroadcastManager.instance;
  }

  private setupBroadcastListener() {
    this.broadcastChannel.onmessage = (event) => {
      const { type, data, timestamp, tournamentId } = event.data;

      // Handle different logging based on event type
      if (type === "TOURNAMENT_DATA" || type === "TOURNAMENT_DATA_ERROR") {
        console.log(`📥 BroadcastManager received ${type}:`, {
          tournamentId,
          timestamp,
        });
      } else if (type === "Ping") {
        console.log(
          `🏓 BroadcastManager received ping #${data.ping} (random: ${data.random}) at ${new Date(data.timestamp).toLocaleTimeString()}`,
        );
      } else {
        console.log(`📥 BroadcastManager received ${type}:`, { timestamp });
      }

      // Notify registered handlers for this event type
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => {
          switch (type) {
            case "TOURNAMENT_DATA":
              handler(event.data as TournamentDataMessage);
              break;
            case "TOURNAMENT_DATA_ERROR":
              handler(event.data as TournamentDataErrorMessage);
              break;
            case "AdminPanelUpdate":
              handler(data as AdminPanelUpdateMessage);
              break;
            case "GamesAdded":
              handler(data as GamesAddedMessage);
              break;
            case "Ping":
              handler(data as Ping);
              break;
            default:
              handler(data);
          }
        });
      }
    };
  }

  // Register a handler for specific event types (AdminPanelUpdate, GamesAdded, etc.)
  on(eventType: string, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    console.log(`📝 Registered handler for ${eventType}`);
  }

  // Unregister a handler
  off(eventType: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }

    console.log(`🗑️ Unregistered handler for ${eventType}`);
  }

  // Convenience methods with proper types and type assertions
  onAdminPanelUpdate(handler: (data: AdminPanelUpdateMessage) => void) {
    this.on("AdminPanelUpdate", handler);
    return () => this.off("AdminPanelUpdate", handler);
  }

  onGamesAdded(handler: (data: GamesAddedMessage) => void) {
    this.on("GamesAdded", handler);
    return () => this.off("GamesAdded", handler);
  }

  onTournamentData(handler: (data: TournamentDataMessage) => void) {
    this.on("TOURNAMENT_DATA", handler);
    return () => this.off("TOURNAMENT_DATA", handler);
  }

  onTournamentDataError(handler: (data: TournamentDataErrorMessage) => void) {
    this.on("TOURNAMENT_DATA_ERROR", handler);
    return () => this.off("TOURNAMENT_DATA_ERROR", handler);
  }

  // Add ping handler convenience method
  onPing(handler: (data: Ping) => void) {
    this.on("Ping", handler);
    return () => this.off("Ping", handler);
  }

  // Mock methods to maintain compatibility with existing SocketManager interface
  getConnectionStatus(): string {
    return "Listening to broadcast channel";
  }

  getError(): string | null {
    return null;
  }

  getLastDataUpdate(): number {
    return Date.now();
  }

  addListener(listener: (data: any) => void) {
    // For compatibility - could be used for status updates
    console.log("📝 Added general listener");
  }

  removeListener(listener: (data: any) => void) {
    // For compatibility
    console.log("🗑️ Removed general listener");
  }

  // Cleanup method
  cleanup() {
    console.log("🧹 BroadcastManager cleaning up...");
    this.broadcastChannel.close();
    this.eventHandlers.clear();
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  BroadcastManager.getInstance().cleanup();
});

export default BroadcastManager;
