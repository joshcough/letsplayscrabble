import express, { Express, Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import path from "path";
import dotenv from 'dotenv';
import { pool } from "./config/database";
import { TournamentRepository } from "./repositories/tournamentRepository";
import { CurrentMatchRepository } from "./repositories/currentMatchRepository";
import createTournamentRoutes from "./routes/tournaments";
import createAdminRoutes from "./routes/admin";
import createOverlayRoutes from "./routes/overlay";
import authRoutes from "./routes/auth";
import { requireAuth } from "./middleware/auth";
import { TournamentPollingService } from "./services/pollingService";

dotenv.config();

const envPath = path.join(__dirname, '..', process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development');
console.log('Full env path:', envPath);
dotenv.config({
  path: envPath
});

// console.log('Current NODE_ENV:', process.env.NODE_ENV);
// console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
// console.log('Env file being used:', process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development');

const tournamentRepository = new TournamentRepository(pool);
const currentMatchRepository = new CurrentMatchRepository(pool);
const pollingService = new TournamentPollingService(tournamentRepository);

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

io.on("connection", (socket) => {
  console.log("Client connected", socket.id);

  socket.on("error", (error: Error) => {
    console.error("Socket error:", error);
  });

  socket.on("disconnect", (reason: string) => {
    console.log("Client disconnected", socket.id, "Reason:", reason);
  });
});

// Add authentication routes (unprotected)
app.use("/api/auth", authRoutes);
app.use("/api/overlay", createOverlayRoutes(tournamentRepository, currentMatchRepository));

// Protected routes
app.use("/api/tournaments", requireAuth, createTournamentRoutes(tournamentRepository));
app.use(
  "/api/admin",
  requireAuth,
  createAdminRoutes(tournamentRepository, currentMatchRepository, io),
);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// Anything that doesn't match the above, send back index.html
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
});

// start the polling service
pollingService.start();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("WebSocket server available");
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down gracefully...");
  pollingService.stop();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});