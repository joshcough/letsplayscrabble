// BroadcastManager.ts - Lightweight manager for display sources with deduplication
import {
  TournamentDataResponse,
  TournamentDataRefresh,
  TournamentDataIncremental,
  TournamentDataError,
} from "@shared/types/broadcast";
import {
  AdminPanelUpdateMessage,
  GamesAddedMessage,
  Ping,
} from "@shared/types/websocket";

type EventHandler = (data: any) => void;

class BroadcastManager {
  private static instance: BroadcastManager;
  private broadcastChannel: BroadcastChannel;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  // Message deduplication - track highest timestamp seen
  private lastSeenTimestamp: number = 0;

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

  // Check and skip duplicate messages
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
        `⏭️ BroadcastManager skipping duplicate ${eventType}: timestamp ${data.timestamp} (last seen: ${this.lastSeenTimestamp})`,
      );
      return true;
    }

    // Update highest seen timestamp
    this.lastSeenTimestamp = data.timestamp;
    console.log(
      `✅ BroadcastManager processing ${eventType}: timestamp ${data.timestamp}`,
    );
    return false;
  }

  private setupBroadcastListener() {
    this.broadcastChannel.onmessage = (event) => {
      const { type, data } = event.data;

      // Only log tournament data events, and only show tournamentId for relevant events
      if (type.startsWith("TOURNAMENT_DATA")) {
        console.log(`📥 BroadcastManager received ${type}:`, {
          tournamentId: data.tournamentId,
          userId: data.userId,
        });
      } else {
        console.log(`📥 BroadcastManager received ${type}:`, {
          timestamp: data?.timestamp,
        });
      }

      // Check for duplicates based on message type (only for timestamped WebSocket relays)
      let shouldSkip = false;
      if (type === "Ping" && data?.timestamp) {
        shouldSkip = this.shouldSkipDuplicateMessage(data, "Ping");
      } else if (type === "AdminPanelUpdate" && data?.timestamp) {
        shouldSkip = this.shouldSkipDuplicateMessage(data, "AdminPanelUpdate");
      } else if (type === "GamesAdded" && data?.timestamp) {
        shouldSkip = this.shouldSkipDuplicateMessage(data, "GamesAdded");
      }

      if (shouldSkip) {
        return; // Skip duplicate message
      }

      // Notify registered handlers for this event type
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => {
          switch (type) {
            case "TOURNAMENT_DATA_RESPONSE":
              handler(data as TournamentDataResponse);
              break;
            case "TOURNAMENT_DATA_REFRESH":
              handler(data as TournamentDataRefresh);
              break;
            case "TOURNAMENT_DATA_INCREMENTAL":
              handler(data as TournamentDataIncremental);
              break;
            case "TOURNAMENT_DATA_ERROR":
              handler(data as TournamentDataError);
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

  // Register a handler for specific event types
  on(eventType: string, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    console.log(`📝 BroadcastManager registered handler for ${eventType}`);
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

    console.log(`🗑️ BroadcastManager unregistered handler for ${eventType}`);
  }

  // Convenience methods with proper types and type assertions
  onAdminPanelUpdate(handler: (data: AdminPanelUpdateMessage) => void) {
    this.on("ADMIN_PANEL_UPDATE", handler);
    return () => this.off("AdminPanelUpdate", handler);
  }

  onGamesAdded(handler: (data: GamesAddedMessage) => void) {
    this.on("GamesAdded", handler);
    return () => this.off("GamesAdded", handler);
  }

  // New tournament data handlers
  onTournamentDataResponse(handler: (data: TournamentDataResponse) => void) {
    this.on("TOURNAMENT_DATA_RESPONSE", handler);
    return () => this.off("TOURNAMENT_DATA_RESPONSE", handler);
  }

  onTournamentDataRefresh(handler: (data: TournamentDataRefresh) => void) {
    this.on("TOURNAMENT_DATA_REFRESH", handler);
    return () => this.off("TOURNAMENT_DATA_REFRESH", handler);
  }

  onTournamentDataIncremental(
    handler: (data: TournamentDataIncremental) => void,
  ) {
    this.on("TOURNAMENT_DATA_INCREMENTAL", handler);
    return () => this.off("TOURNAMENT_DATA_INCREMENTAL", handler);
  }

  onTournamentDataError(handler: (data: TournamentDataError) => void) {
    this.on("TOURNAMENT_DATA_ERROR", handler);
    return () => this.off("TOURNAMENT_DATA_ERROR", handler);
  }

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
    console.log("📝 BroadcastManager added general listener");
  }

  removeListener(listener: (data: any) => void) {
    // For compatibility
    console.log("🗑️ BroadcastManager removed general listener");
  }

  // Method to get last seen timestamp (useful for debugging)
  getLastSeenTimestamp(): number {
    return this.lastSeenTimestamp;
  }

  // Method to reset timestamp counter (useful for testing)
  resetTimestampCounter(): void {
    this.lastSeenTimestamp = 0;
    console.log("🔄 BroadcastManager manually reset lastSeenTimestamp");
  }

  // Cleanup method
  cleanup() {
    console.log("🧹 BroadcastManager cleaning up...");
    this.broadcastChannel.close();
    this.eventHandlers.clear();
    this.lastSeenTimestamp = 0;
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  BroadcastManager.getInstance().cleanup();
});

export default BroadcastManager;
