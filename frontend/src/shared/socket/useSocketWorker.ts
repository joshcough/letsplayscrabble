import { useState, useEffect, useRef, useCallback } from 'react';
import { MatchWithPlayers } from '@shared/types/admin';
import { ProcessedTournament, PlayerStats } from '@shared/types/tournament';
import { WorkerMessage } from '@shared/types/socket';

// Import worker using Vite's syntax
// @ts-ignore -- Vite-specific import
import WorkerScript from './socketWorker?worker&type=shared';

let worker: SharedWorker | null = null;
const WORKER_NAME = 'scrabble-socket-worker';
const DATA_TIMEOUT = 10000; // 10 seconds
const RECONNECT_DELAY = 5000; // 5 seconds

function createWorker(): SharedWorker | null {
  try {
    console.log("[useSocketWorker] Attempting to create shared worker");

    // Use the imported worker script directly
    const newWorker = new SharedWorker(WorkerScript, {
      name: WORKER_NAME,
      type: 'module'
    });

    console.log("[useSocketWorker] Worker created with name:", WORKER_NAME);
    return newWorker;
  } catch (error) {
    console.error("[useSocketWorker] Failed to create worker:", error);
    return null;
  }
}

export default function useSocketWorker() {
  const [matchData, setMatchData] = useState<MatchWithPlayers | null>(null);
  const [tournament, setTournament] = useState<ProcessedTournament | null>(null);
  const [standings, setStandings] = useState<PlayerStats[] | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [clientCount, setClientCount] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasDataRef = useRef(false);
  const workerRef = useRef<SharedWorker | null>(null);

  const resetWorker = useCallback(() => {
    console.log("[useSocketWorker] Resetting worker");
    if (workerRef.current) {
      try {
        workerRef.current.port.close();
      } catch (e) {
        console.error("[useSocketWorker] Error closing worker port:", e);
      }
      workerRef.current = null;
      worker = null;
    }
    hasDataRef.current = false;
    setMatchData(null);
    setTournament(null);
    setStandings(null);
    setConnectionStatus("Reconnecting...");

    setTimeout(() => {
      initWorker();
    }, RECONNECT_DELAY);
  }, []);

  const initWorker = useCallback(() => {
    try {
      if (!worker) {
        worker = createWorker();
        if (!worker) {
          throw new Error("Failed to create SharedWorker");
        }
        workerRef.current = worker;
      }

      const port = worker.port;

      const handleMessage = (e: MessageEvent<WorkerMessage>) => {
        console.log("[useSocketWorker] Received message:", e.data.type, e.data);
        const { type, data } = e.data;

        switch (type) {
          case 'connect':
            console.log("[useSocketWorker] Connected to server");
            setConnectionStatus("Connected");
            setError(null);

            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
              if (!hasDataRef.current) {
                console.log("[useSocketWorker] Data timeout - initiating reset");
                resetWorker();
              }
            }, DATA_TIMEOUT);

            port.postMessage({ type: 'requestInitialData' });
            break;

          case 'disconnect':
            console.log("[useSocketWorker] Disconnected:", data);
            setConnectionStatus(`Disconnected: ${data}`);
            break;

          case 'connect_error':
            console.error("[useSocketWorker] Connection error:", data);
            setConnectionStatus(`Connection Error`);
            setError(`Connection error: ${data}`);
            break;

          case 'matchUpdate':
            console.log("[useSocketWorker] Match update received:", data);
            setMatchData(data);
            setLastUpdate(new Date().toISOString());
            hasDataRef.current = true;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            break;

          case 'tournamentUpdate':
            console.log("[useSocketWorker] Tournament update received:", data);
            if (data?.tournament && data?.standings) {
              setTournament(data.tournament);
              setStandings(data.standings);
              setLastUpdate(new Date().toISOString());
              hasDataRef.current = true;
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
            } else {
              console.error("[useSocketWorker] Invalid tournament data received:", data);
            }
            break;

          case 'clientCount':
            setClientCount(data);
            break;

          case 'error':
            console.error("[useSocketWorker] Error received:", data);
            setError(data);
            break;

          default:
            console.log("[useSocketWorker] Unknown message type:", type);
            break;
        }
      };

      port.onmessage = handleMessage;
      port.start();

      worker.onerror = (error) => {
        console.error("[useSocketWorker] Worker error:", error);
        setError(`Worker error: ${error.message}`);
        resetWorker();
      };

    } catch (err) {
      console.error("[useSocketWorker] Worker initialization failed:", err);
      setError(`Worker initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);

      setTimeout(() => {
        resetWorker();
      }, RECONNECT_DELAY);
    }
  }, [resetWorker]);

  useEffect(() => {
    initWorker();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (workerRef.current) {
        console.log("[useSocketWorker] Cleanup - sending disconnect message");
        try {
          workerRef.current.port.postMessage({ type: 'disconnect' });
          workerRef.current.port.close();
        } catch (e) {
          console.error("[useSocketWorker] Error during cleanup:", e);
        }
      }
    };
  }, [initWorker]);

  return {
    matchData,
    tournament,
    standings,
    connectionStatus,
    error,
    lastUpdate,
    clientCount
  };
}