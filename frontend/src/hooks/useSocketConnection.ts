import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import SocketManager from "./socketManager";

interface UseSocketConnectionReturn {
  socket: Socket | null;
  connectionStatus: string;
  error: string | null;
  lastDataUpdate: number;
}

export const useSocketConnection = (): UseSocketConnectionReturn => {
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(Date.now());

  const socketManager = SocketManager.getInstance();

  useEffect(() => {
    // Get initial values
    setConnectionStatus(socketManager.getConnectionStatus());
    setError(socketManager.getError());
    setLastDataUpdate(socketManager.getLastDataUpdate());

    // Listen for updates
    const handleUpdate = (data: any) => {
      if (data.type === 'statusChange') {
        setConnectionStatus(data.status);
      } else if (data.type === 'error') {
        setError(data.error);
      }
      setLastDataUpdate(Date.now());
    };

    socketManager.addListener(handleUpdate);

    return () => {
      socketManager.removeListener(handleUpdate);
    };
  }, []);

  return {
    socket: socketManager.getSocket(),
    connectionStatus,
    error,
    lastDataUpdate,
  };
};