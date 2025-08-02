import { useEffect } from "react";

import { CurrentMatch } from "@shared/types/currentMatch";
import { Socket } from "socket.io-client";

/**
 * Hook to listen for AdminPanelUpdate messages
 */
export const useAdminPanelUpdates = (
  socket: Socket | null,
  onUpdate: (data: CurrentMatch) => void,
) => {
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: CurrentMatch) => {
      console.log("Received AdminPanelUpdate:", data);
      onUpdate(data);
    };

    socket.on("AdminPanelUpdate", handleUpdate);

    return () => {
      socket.off("AdminPanelUpdate", handleUpdate);
    };
  }, [socket, onUpdate]);
};

/**
 * Hook to listen for GamesAdded messages
 */
export const useGamesAdded = (
  socket: Socket | null,
  onGamesAdded: (data: { tournamentId: number }) => void,
) => {
  useEffect(() => {
    if (!socket) return;

    const handleGamesAdded = (data: { tournamentId: number }) => {
      console.log("Received GamesAdded:", data);
      onGamesAdded(data);
    };

    socket.on("GamesAdded", handleGamesAdded);

    return () => {
      socket.off("GamesAdded", handleGamesAdded);
    };
  }, [socket, onGamesAdded]);
};

/**
 * Hook to listen for multiple socket events with a single callback
 */
export const useSocketEvents = (
  socket: Socket | null,
  events: Record<string, (data: any) => void>,
) => {
  useEffect(() => {
    if (!socket) return;

    const cleanupFunctions: (() => void)[] = [];

    Object.entries(events).forEach(([eventName, handler]) => {
      const wrappedHandler = (data: any) => {
        console.log(`Received ${eventName}:`, data);
        handler(data);
      };

      socket.on(eventName, wrappedHandler);
      cleanupFunctions.push(() => socket.off(eventName, wrappedHandler));
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [socket, events]);
};
