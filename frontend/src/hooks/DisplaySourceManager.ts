// DisplaySourceManager.ts - Lightweight manager for display sources
import { CurrentMatch } from "@shared/types/currentMatch";

type EventHandler = (data: any) => void;

class DisplaySourceManager {
  private static instance: DisplaySourceManager;
  private broadcastChannel: BroadcastChannel;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  private constructor() {
    console.log("📺 DisplaySourceManager initializing...");
    this.broadcastChannel = new BroadcastChannel('tournament-updates');
    this.setupBroadcastListener();
  }

  static getInstance(): DisplaySourceManager {
    if (!DisplaySourceManager.instance) {
      DisplaySourceManager.instance = new DisplaySourceManager();
    }
    return DisplaySourceManager.instance;
  }

  private setupBroadcastListener() {
    this.broadcastChannel.onmessage = (event) => {
      const { type, data, timestamp, tournamentId } = event.data;

      // Only log tournament data events, and only show tournamentId for relevant events
      if (type === 'TOURNAMENT_DATA' || type === 'TOURNAMENT_DATA_ERROR') {
        console.log(`📥 Display source received ${type}:`, { tournamentId, timestamp });
      } else {
        console.log(`📥 Display source received ${type}:`, { timestamp });
      }

      // Notify registered handlers for this event type
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        handlers.forEach(handler => {
          // For TOURNAMENT_DATA and TOURNAMENT_DATA_ERROR, pass the full message structure
          if (type === 'TOURNAMENT_DATA' || type === 'TOURNAMENT_DATA_ERROR') {
            handler({ tournamentId, data, error: event.data.error });
          } else {
            // For other events, pass just the data
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

  // Convenience methods that mirror the socket helper patterns
  onAdminPanelUpdate(handler: (data: CurrentMatch) => void) {
    this.on("AdminPanelUpdate", handler);
    return () => this.off("AdminPanelUpdate", handler);
  }

  onGamesAdded(handler: (data: { tournamentId: number }) => void) {
    this.on("GamesAdded", handler);
    return () => this.off("GamesAdded", handler);
  }

  // New method for tournament data broadcasts
  onTournamentData(handler: (data: { tournamentId: number, data: any }) => void) {
    this.on("TOURNAMENT_DATA", handler);
    return () => this.off("TOURNAMENT_DATA", handler);
  }

  onTournamentDataError(handler: (data: { tournamentId: number, error: string }) => void) {
    this.on("TOURNAMENT_DATA_ERROR", handler);
    return () => this.off("TOURNAMENT_DATA_ERROR", handler);
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
    console.log("🧹 Display source cleaning up...");
    this.broadcastChannel.close();
    this.eventHandlers.clear();
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  DisplaySourceManager.getInstance().cleanup();
});

export default DisplaySourceManager;