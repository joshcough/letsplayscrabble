import express, { Express, Request, Response } from "express";

import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { Server as SocketIOServer } from "socket.io";

import { pool } from "./config/database";
import { requireAuth } from "./middleware/auth";
import { CurrentMatchRepository } from "./repositories/currentMatchRepository";
import { CrossTablesPlayerRepository } from "./repositories/crossTablesPlayerRepository";
import { CrossTablesHeadToHeadRepository } from "./repositories/crossTablesHeadToHeadRepository";
import { TournamentRepository } from "./repositories/tournamentRepository";
import createAdminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import { cacheRoutes } from "./routes/cache";
import createOverlayRoutes from "./routes/overlay";
import userSettingsRoutes from "./routes/userSettings";
import { protectedPollingRoutes } from "./routes/tournament/polling";
import { protectedTournamentRoutes } from "./routes/tournament/protected";
import { unprotectedTournamentRoutes } from "./routes/tournament/unprotected";
import { CrossTablesSyncService } from "./services/crossTablesSync";
import { CrossTablesHeadToHeadService } from "./services/crossTablesHeadToHeadService";
import { PingService } from "./services/pingService";
import { TournamentPollingService } from "./services/pollingService";

const morgan = require("morgan");

// Helper function to determine project root path
function getProjectRoot(): string {
  if (process.env.NODE_ENV === "production") {
    // In production (Heroku), we're in /app/backend/dist/backend/backend/src
    // Need to go up to /app
    return path.join(__dirname, "../../../../../");
  } else {
    // In development, we need to go up 2 levels from src
    return path.join(__dirname, "../../");
  }
}

dotenv.config();

const envPath = path.join(
  __dirname,
  "..",
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development",
);
dotenv.config({ path: envPath });

const app: Express = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://letsplayscrabble-dev-test-d51cd69c9755.herokuapp.com",
] as const;

const io = new SocketIOServer(server, {
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      console.log("Incoming origin:", origin);

      if (allowedOrigins.includes(origin as any)) {
        callback(null, true);
      } else {
        console.log("Origin blocked:", origin);
        callback(new Error("Origin not allowed"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

const crossTablesPlayerRepository = new CrossTablesPlayerRepository();
const crossTablesHeadToHeadRepository = new CrossTablesHeadToHeadRepository();
const crossTablesHeadToHeadService = new CrossTablesHeadToHeadService(crossTablesHeadToHeadRepository);
const tournamentRepository = new TournamentRepository(crossTablesHeadToHeadService);
const crossTablesSyncService = new CrossTablesSyncService(crossTablesPlayerRepository, tournamentRepository);
const currentMatchRepository = new CurrentMatchRepository(pool);
const pollingService = new TournamentPollingService(tournamentRepository, crossTablesSyncService, io);
const pingService = new PingService(io);

app.use(morgan("combined"));
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

// Add error handling for the server
io.engine.on("connection_error", (err: Error) => {
  console.log("Connection error:", err);
});

// Store intervals for cleanup
const clientIntervals = new Map<string, NodeJS.Timeout>();

io.on("connection", (socket) => {
  console.log(
    `🔌 Client connected: ${socket.id} (Total clients: ${io.engine.clientsCount})`,
  );

  // Send ping every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    socket.emit("ping");
  }, 30000);

  // Store interval for cleanup
  clientIntervals.set(socket.id, pingInterval);

  socket.on("error", (error: Error) => {
    console.error("Socket error:", error);
  });

  socket.on("disconnect", (reason: string) => {
    console.log(
      `🔌 Client disconnected: ${socket.id} (Reason: ${reason}) (Remaining: ${io.engine.clientsCount - 1})`,
    );

    // Clean up ping interval
    const interval = clientIntervals.get(socket.id);
    if (interval) {
      clearInterval(interval);
      clientIntervals.delete(socket.id);
    }
  });
});

// Global ping to all connected clients every 30 seconds (backup)
setInterval(() => {
  io.emit("ping");
}, 30000);

// Unprotected routes
app.use("/api/auth", authRoutes);
app.use("/api/overlay", createOverlayRoutes(currentMatchRepository));

app.use("/api/public", unprotectedTournamentRoutes(tournamentRepository));

// Protected user routes
app.use("/api/users/settings", requireAuth, userSettingsRoutes);

// Protected routes
app.use(
  "/api/private/tournaments",
  requireAuth,
  protectedTournamentRoutes(tournamentRepository, crossTablesSyncService, crossTablesHeadToHeadService, io),
);

app.use(
  "/api/private/tournaments",
  requireAuth,
  protectedPollingRoutes(tournamentRepository),
);

app.use(
  "/api/admin",
  requireAuth,
  createAdminRoutes(currentMatchRepository, io),
);

app.use(
  "/api/private/cache",
  requireAuth,
  cacheRoutes(io),
);

// Get the project root once
const projectRoot = getProjectRoot();

// Serve static files from the React frontend app
app.use(express.static(path.join(projectRoot, "frontend/build")));

// Anything that doesn't match the above, send back index.html
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, "frontend/build/index.html"));
});

// start the polling service
pollingService.start();
pingService.start();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("WebSocket server available");
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down gracefully...");

  // Clean up all ping intervals
  clientIntervals.forEach((interval) => {
    clearInterval(interval);
  });
  clientIntervals.clear();

  pollingService.stop();
  pingService.stop();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
