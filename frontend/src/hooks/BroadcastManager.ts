// BroadcastManager.ts - Lightweight manager for display sources with deduplication
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

  // Message deduplication - track highest messageId seen
  private lastSeenMessageId: number = 0;

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
    data: { messageId?: number },
    eventType: string,
  ): boolean {
    if (!data.messageId) {
      console.warn(`⚠️ ${eventType} message missing messageId`);
      return false; // Process messages without messageId
    }

    if (data.messageId <= this.lastSeenMessageId) {
      console.log(
        `⏭️ BroadcastManager skipping duplicate ${eventType}: messageId ${data.messageId} (last seen: ${this.lastSeenMessageId})`,
      );
      return true;
    }

    // Update highest seen messageId
    this.lastSeenMessageId = data.messageId;
    console.log(
      `✅ BroadcastManager processing ${eventType}: messageId ${data.messageId}`,
    );
    return false;
  }

  private setupBroadcastListener() {
    this.broadcastChannel.onmessage = (event) => {
      const { type, data, timestamp, tournamentId } = event.data;

      // Only log tournament data events, and only show tournamentId for relevant events
      if (type === "TOURNAMENT_DATA" || type === "TOURNAMENT_DATA_ERROR") {
        console.log(`📥 BroadcastManager received ${type}:`, {
          tournamentId,
          timestamp,
        });
      } else {
        console.log(`📥 BroadcastManager received ${type}:`, { timestamp });
      }

      // Check for duplicates based on message type
      let shouldSkip = false;
      if (type === "Ping" && data?.messageId) {
        shouldSkip = this.shouldSkipDuplicateMessage(data, "Ping");
      } else if (type === "AdminPanelUpdate" && data?.messageId) {
        shouldSkip = this.shouldSkipDuplicateMessage(data, "AdminPanelUpdate");
      } else if (type === "GamesAdded" && data?.messageId) {
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

  // Method to get last seen messageId (useful for debugging)
  getLastSeenMessageId(): number {
    return this.lastSeenMessageId;
  }

  // Method to reset messageId counter (useful for testing)
  resetMessageIdCounter(): void {
    this.lastSeenMessageId = 0;
    console.log("🔄 BroadcastManager manually reset lastSeenMessageId");
  }

  // Cleanup method
  cleanup() {
    console.log("🧹 BroadcastManager cleaning up...");
    this.broadcastChannel.close();
    this.eventHandlers.clear();
    this.lastSeenMessageId = 0;
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  BroadcastManager.getInstance().cleanup();
});

export default BroadcastManager;
