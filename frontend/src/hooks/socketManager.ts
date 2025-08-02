// socketManager.ts - Create this new file
import io, { Socket } from "socket.io-client";

import { API_BASE } from "../config/api";

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private connectionStatus: string = "Initializing...";
  private error: string | null = null;
  private lastDataUpdate: number = Date.now();
  private listeners: Set<(data: any) => void> = new Set();

  private constructor() {
    this.connectSocket();
  }

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  private connectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      this.socket = io(API_BASE, {
        transports: ["polling", "websocket"],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        withCredentials: true,
      });

      this.socket.on("connect", () => {
        console.log("Socket connected");
        this.connectionStatus = "Connected to server";
        this.error = null;
        this.lastDataUpdate = Date.now();
        this.notifyListeners({
          type: "statusChange",
          status: this.connectionStatus,
        });
      });

      this.socket.on("connect_error", (error: Error) => {
        console.error("Socket connect error:", error);
        this.connectionStatus = `Connection error: ${error.message}`;
        this.notifyListeners({
          type: "statusChange",
          status: this.connectionStatus,
        });
      });

      this.socket.on("disconnect", (reason: string) => {
        console.log("Socket disconnected:", reason);
        this.connectionStatus = `Disconnected from server: ${reason}`;
        this.notifyListeners({
          type: "statusChange",
          status: this.connectionStatus,
        });
      });

      this.socket.on("error", (error: Error) => {
        console.error("Socket error:", error);
        this.error = `Socket error: ${error.message}`;
        this.notifyListeners({ type: "error", error: this.error });
      });

      this.socket.on("ping", () => {
        this.lastDataUpdate = Date.now();
      });
    } catch (error) {
      const err = error as Error;
      console.error("Socket initialization error:", err);
      this.error = `Socket initialization failed: ${err.message}`;
      this.connectionStatus = `Failed to initialize socket connection`;
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
}

export default SocketManager;
