// WorkerPage.tsx - Hidden worker page that handles WebSocket connections
import React, { useEffect, useState } from "react";
import WorkerSocketManager from "../hooks/WorkerSocketManager";

const WorkerPage: React.FC = () => {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  useEffect(() => {
    const worker = WorkerSocketManager.getInstance();

    // Listen for status updates
    const handleStatusUpdate = (data: any) => {
      if (data.type === "statusChange") {
        setStatus(data.status);
      } else if (data.type === "error") {
        setError(data.error);
      }
    };

    worker.addListener(handleStatusUpdate);

    // Initial status
    setStatus(worker.getConnectionStatus());
    setError(worker.getError());
    setLastUpdate(worker.getLastDataUpdate());

    // Update last update time periodically
    const interval = setInterval(() => {
      setLastUpdate(worker.getLastDataUpdate());
    }, 1000);

    return () => {
      worker.removeListener(handleStatusUpdate);
      clearInterval(interval);
    };
  }, []);

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

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 9999,
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
        <div style={{ color: "#ff4444", marginBottom: "5px" }}>❌ {error}</div>
      )}

      <div style={{ fontSize: "10px", color: "#aaa" }}>
        Last activity: {formatLastUpdate()}
      </div>

      <div style={{ fontSize: "10px", color: "#aaa", marginTop: "5px" }}>
        Broadcasting on 'tournament-updates' channel
      </div>
    </div>
  );
};

export default WorkerPage;
