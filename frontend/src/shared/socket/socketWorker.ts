import { io, Socket } from "socket.io-client";
import { MatchWithPlayers } from "@shared/types/admin";
import { WorkerMessage } from "@shared/types/socket";
import { API_BASE } from "../../config/api";
import { ProcessedTournament, PlayerStats } from "@shared/types/tournament";

declare const self: SharedWorkerGlobalScope;

class SocketWorker {
  private socket: Socket | null = null;
  private clients: Set<MessagePort> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentTournamentId: number | null = null;
  private currentDivisionId: number | null = null;
  private lastMatchData: MatchWithPlayers | null = null;
  private lastTournamentData: {
    tournament: ProcessedTournament;
    standings: PlayerStats[];
  } | null = null;

  constructor() {
    console.log("[SocketWorker] Initializing");
    this.initSocket();
  }

  private initSocket() {
    if (this.socket?.connected) {
      console.log("[SocketWorker] Socket already connected");
      return;
    }

    console.log("[SocketWorker] Creating new socket connection to:", API_BASE);
    this.socket = io(API_BASE, {
      transports: ["websocket", "polling"], // Try WebSocket first
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 60000,
      forceNew: true,
      withCredentials: true,
    });

    this.setupSocketListeners();

    // Set up connection handler after socket initialization
    self.onconnect = (e: MessageEvent) => this.handleNewConnection(e);
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[SocketWorker] Socket connected, ID:", this.socket?.id);
      this.broadcastToClients({ type: "connect" });
      this.reconnectAttempts = 0;
      this.fetchCurrentMatch();
    });

    this.socket.on("connect_error", (error: Error) => {
      console.error("[SocketWorker] Connection error:", error.message);
      this.broadcastToClients({
        type: "connect_error",
        data: error.message,
      });
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("[SocketWorker] Socket disconnected:", reason);
      this.broadcastToClients({
        type: "disconnect",
        data: reason,
      });
    });

    this.socket.on("matchUpdate", async (data: MatchWithPlayers) => {
      console.log("[SocketWorker] Received match update:", data.matchData.id);
      this.lastMatchData = data;
      this.broadcastToClients({
        type: "matchUpdate",
        data,
      });

      if (
        data.matchData.tournament_id !== undefined &&
        data.matchData.division_id !== undefined &&
        (data.matchData.tournament_id !== this.currentTournamentId ||
          data.matchData.division_id !== this.currentDivisionId)
      ) {
        console.log(
          "[SocketWorker] Tournament/division changed:",
          data.matchData.tournament_id,
          data.matchData.division_id
        );
        await this.fetchTournamentData(
          data.matchData.tournament_id,
          data.matchData.division_id
        );
      }
    });
  }

  private handleNewConnection(e: MessageEvent) {
    console.log("[SocketWorker] New client connecting");
    const port = e.ports[0];
    this.clients.add(port);

    // Send current client count
    this.broadcastToClients({
      type: "clientCount",
      data: this.clients.size,
    });

    // Send cached data if available
    if (this.lastMatchData) {
      console.log("[SocketWorker] Sending cached match data to new client");
      port.postMessage({
        type: "matchUpdate",
        data: this.lastMatchData,
      });
    }

    if (this.lastTournamentData) {
      console.log("[SocketWorker] Sending cached tournament data to new client");
      port.postMessage({
        type: "tournamentUpdate",
        data: this.lastTournamentData,
      });
    }

    port.onmessage = (e: MessageEvent) => {
      console.log("[SocketWorker] Received message from client:", e.data);
      this.handleMessage(e.data, port);
    };

    port.onmessageerror = (error) => {
      console.error("[SocketWorker] Message error:", error);
      this.clients.delete(port);
      this.broadcastToClients({
        type: "clientCount",
        data: this.clients.size,
      });
    };

    port.start();

    if (this.socket?.connected) {
      port.postMessage({ type: "connect" });
    }
  }

  private async fetchCurrentMatch() {
    try {
      console.log("[SocketWorker] Fetching current match");
      const response = await fetch(`${API_BASE}/api/overlay/match/current`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[SocketWorker] Current match data received:", data);

      this.lastMatchData = data;
      this.broadcastToClients({
        type: "matchUpdate",
        data,
      });

      if (
        data.matchData?.tournament_id !== undefined &&
        data.matchData?.division_id !== undefined
      ) {
        await this.fetchTournamentData(
          data.matchData.tournament_id,
          data.matchData.division_id
        );
      }
    } catch (error) {
      console.error("[SocketWorker] Error fetching match:", error);
      this.broadcastToClients({
        type: "error",
        data: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async fetchTournamentData(tournamentId: number, divisionId: number) {
    try {
      console.log("[SocketWorker] Fetching tournament data:", {
        tournamentId,
        divisionId,
      });
      const response = await fetch(
        `${API_BASE}/api/tournaments/public/${tournamentId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tournamentData: ProcessedTournament = await response.json();
      console.log("[SocketWorker] Tournament data received");

      this.currentTournamentId = tournamentId;
      this.currentDivisionId = divisionId;

      const divisionStandings = this.calculateRanks(
        tournamentData.standings[divisionId]
      );

      const processedData = {
        tournament: tournamentData,
        standings: divisionStandings,
      };

      this.lastTournamentData = processedData;
      this.broadcastToClients({
        type: "tournamentUpdate",
        data: processedData,
      });
    } catch (error) {
      console.error("[SocketWorker] Error fetching tournament:", error);
      this.broadcastToClients({
        type: "error",
        data: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private calculateRanks(players: PlayerStats[]): PlayerStats[] {
    return [...players]
      .sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.spread - a.spread;
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
  }

  private broadcastToClients(message: WorkerMessage) {
    console.log(
      `[SocketWorker] Broadcasting to ${this.clients.size} clients:`,
      message.type
    );
    
    const deadClients = new Set<MessagePort>();
    
    this.clients.forEach((client) => {
      try {
        client.postMessage(message);
      } catch (error) {
        console.error("[SocketWorker] Error broadcasting to client:", error);
        deadClients.add(client);
      }
    });

    // Clean up dead clients
    deadClients.forEach(client => {
      this.clients.delete(client);
    });

    if (deadClients.size > 0) {
      this.broadcastToClients({
        type: "clientCount",
        data: this.clients.size,
      });
    }
  }

  private handleMessage(message: WorkerMessage, port: MessagePort) {
    console.log("[SocketWorker] Handling message:", message.type);
    switch (message.type) {
      case "disconnect":
        this.clients.delete(port);
        this.broadcastToClients({
          type: "clientCount",
          data: this.clients.size,
        });
        if (this.clients.size === 0 && this.socket) {
          console.log("[SocketWorker] No more clients, disconnecting socket");
          this.socket.disconnect();
          this.socket = null;
        }
        break;

      case "requestInitialData":
        console.log("[SocketWorker] Initial data requested");
        this.fetchCurrentMatch();
        break;
    }
  }
}

new SocketWorker();

export {};