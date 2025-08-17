// WorkerPage.tsx - Hidden worker page that handles WebSocket connections
import React, { useEffect, useState } from "react";

import WorkerSocketManager from "../hooks/WorkerSocketManager";
import { ApiService } from "../services/interfaces";

interface StatusMessage {
  status: string;
  error: string | null;
  lastDataUpdate: number;
  cacheStats: { size: number; keys: string[] };
}

interface WebSocketMessage {
  eventType: string;
  data: any;
  timestamp: number;
}

interface BroadcastMessage {
  messageType: string;
  data: any;
  timestamp: number;
}

const WorkerPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [cacheStats, setCacheStats] = useState<{
    size: number;
    keys: string[];
  }>({ size: 0, keys: [] });

  // Extended debugging state
  const [wsMessages, setWsMessages] = useState<WebSocketMessage[]>([]);
  const [broadcastMessages, setBroadcastMessages] = useState<
    BroadcastMessage[]
  >([]);
  const [messageStats, setMessageStats] = useState<Record<string, number>>({});

  // Check for extended mode
  const urlParams = new URLSearchParams(window.location.search);
  const extendedMode = urlParams.has("extended");

  useEffect(() => {
    const worker = WorkerSocketManager.getInstance(apiService);
    const statusChannel = new BroadcastChannel("worker-status");

    // Listen for status updates via status channel
    const handleStatusMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      if (type === "WORKER_STATUS_UPDATE") {
        const statusData = data as StatusMessage;
        setStatus(statusData.status);
        setError(statusData.error);
        setLastUpdate(statusData.lastDataUpdate);
        setCacheStats(statusData.cacheStats);
      } else if (type === "WEBSOCKET_MESSAGE" && extendedMode) {
        const wsMsg = data as WebSocketMessage;

        // Always count in stats
        setMessageStats((prev) => ({
          ...prev,
          [`WS:${wsMsg.eventType}`]: (prev[`WS:${wsMsg.eventType}`] || 0) + 1,
        }));

        // Only add to message feed if it's not a ping (too noisy)
        if (wsMsg.eventType !== "Ping") {
          setWsMessages((prev) => [...prev.slice(-19), wsMsg]); // Keep last 20
        }
      } else if (type === "BROADCAST_MESSAGE" && extendedMode) {
        const bcMsg = data as BroadcastMessage;
        setBroadcastMessages((prev) => [...prev.slice(-19), bcMsg]); // Keep last 20
        setMessageStats((prev) => ({
          ...prev,
          [`BC:${bcMsg.messageType}`]:
            (prev[`BC:${bcMsg.messageType}`] || 0) + 1,
        }));
      }
    };

    statusChannel.onmessage = handleStatusMessage;

    // Get initial status
    setStatus(worker.getConnectionStatus());
    setError(worker.getError());
    setLastUpdate(worker.getLastDataUpdate());

    // No more periodic polling - everything comes via broadcast!

    return () => {
      statusChannel.close();
    };
  }, [extendedMode]);

  const getStatusColor = () => {
    if (error) return "#ff4444";
    if (status.includes("Connected")) return "#44ff44";
    if (status.includes("Connecting") || status.includes("Initializing"))
      return "#ffaa44";
    return "#666666";
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Never";
    const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    return `${Math.floor(secondsAgo / 3600)}h ago`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatData = (data: any) => {
    if (typeof data === "object") {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: extendedMode ? "row" : "column",
        gap: "10px",
        position: "fixed",
        top: "10px",
        left: "10px",
        zIndex: 9999,
        flexWrap: "wrap",
        maxWidth: extendedMode ? "95vw" : "auto",
      }}
    >
      {/* Main Status Panel */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          fontFamily: "monospace",
          fontSize: "12px",
          minWidth: "300px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
          🔧 Tournament Worker Status
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "5px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: getStatusColor(),
            }}
          />
          <span>{status}</span>
        </div>

        {error && (
          <div style={{ color: "#ff4444", marginBottom: "5px" }}>
            ❌ {error}
          </div>
        )}

        <div style={{ fontSize: "10px", color: "#aaa" }}>
          Last activity: {formatLastUpdate()}
        </div>

        <div style={{ fontSize: "10px", color: "#aaa", marginTop: "5px" }}>
          Broadcasting on 'tournament-updates' & 'worker-status' channels
        </div>

        <div style={{ fontSize: "10px", color: "#aaa", marginTop: "5px" }}>
          Cache: {cacheStats.size} tournaments cached
        </div>

        {extendedMode && cacheStats.keys.length > 0 && (
          <div style={{ fontSize: "10px", color: "#aaa", marginTop: "5px" }}>
            Keys: {cacheStats.keys.join(", ")}
          </div>
        )}

        {!extendedMode && (
          <div style={{ fontSize: "10px", color: "#888", marginTop: "10px" }}>
            Add ?extended to URL for debug panels
          </div>
        )}
      </div>

      {/* Extended Mode - Stats Panel */}
      {extendedMode && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontFamily: "monospace",
            fontSize: "11px",
            width: "250px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
            📊 Message Stats
          </div>

          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                color: "#4CAF50",
                fontSize: "10px",
                marginBottom: "5px",
              }}
            >
              WebSocket Messages:
            </div>
            {Object.entries(messageStats)
              .filter(([key]) => key.startsWith("WS:"))
              .map(([key, count]) => (
                <div key={key} style={{ fontSize: "9px", marginLeft: "10px" }}>
                  {key.replace("WS:", "")}: {count}
                </div>
              ))}
          </div>

          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                color: "#2196F3",
                fontSize: "10px",
                marginBottom: "5px",
              }}
            >
              Broadcast Messages:
            </div>
            {Object.entries(messageStats)
              .filter(([key]) => key.startsWith("BC:"))
              .map(([key, count]) => (
                <div key={key} style={{ fontSize: "9px", marginLeft: "10px" }}>
                  {key.replace("BC:", "")}: {count}
                </div>
              ))}
          </div>

          <div>
            <div
              style={{
                color: "#FF9800",
                fontSize: "10px",
                marginBottom: "5px",
              }}
            >
              Cache Details:
            </div>
            <div style={{ fontSize: "9px", marginLeft: "10px" }}>
              Size: {cacheStats.size} tournaments
            </div>
            {cacheStats.keys.map((key) => (
              <div
                key={key}
                style={{ fontSize: "8px", marginLeft: "15px", color: "#ccc" }}
              >
                {key}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extended Mode - WebSocket Messages */}
      {extendedMode && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontFamily: "monospace",
            fontSize: "11px",
            width: "400px",
            maxHeight: "600px",
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
            📡 WebSocket Messages (Last 20, Pings Filtered)
          </div>

          {wsMessages.length === 0 ? (
            <div style={{ color: "#888", fontStyle: "italic" }}>
              No messages yet...
            </div>
          ) : (
            wsMessages
              .slice()
              .reverse()
              .map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "10px",
                    padding: "5px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "3px",
                    fontSize: "10px",
                  }}
                >
                  <div style={{ color: "#4CAF50", fontWeight: "bold" }}>
                    {formatTimestamp(msg.timestamp)} - {msg.eventType}
                  </div>
                  <pre
                    style={{
                      margin: "5px 0 0 0",
                      fontSize: "9px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "100px",
                      overflow: "auto",
                    }}
                  >
                    {formatData(msg.data)}
                  </pre>
                </div>
              ))
          )}
        </div>
      )}

      {/* Extended Mode - Broadcast Messages */}
      {extendedMode && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontFamily: "monospace",
            fontSize: "11px",
            width: "400px",
            maxHeight: "600px",
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
            📢 Broadcast Messages (Last 20)
          </div>

          {broadcastMessages.length === 0 ? (
            <div style={{ color: "#888", fontStyle: "italic" }}>
              No messages yet...
            </div>
          ) : (
            broadcastMessages
              .slice()
              .reverse()
              .map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "10px",
                    padding: "5px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "3px",
                    fontSize: "10px",
                  }}
                >
                  <div style={{ color: "#2196F3", fontWeight: "bold" }}>
                    {formatTimestamp(msg.timestamp)} - {msg.messageType}
                  </div>
                  <pre
                    style={{
                      margin: "5px 0 0 0",
                      fontSize: "9px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "100px",
                      overflow: "auto",
                    }}
                  >
                    {formatData(msg.data)}
                  </pre>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerPage;
