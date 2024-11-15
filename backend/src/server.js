const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const db = require("./config/database");
const data = require("./services/dataProcessing");
const TournamentRepository = require("./repositories/tournaments");
const CurrentMatchRepository = require("./repositories/currentMatch");
const createTournamentRoutes = require("./routes/tournaments");
const createAdminRoutes = require("./routes/admin");
const TournamentPollingService = require("./services/polling-service");

const tournamentRepository = new TournamentRepository(db.pool);
const currentMatchRepository = new CurrentMatchRepository(db.pool);
const pollingService = new TournamentPollingService(tournamentRepository);

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://letsplayscrabble-dev-test-d51cd69c9755.herokuapp.com",
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Log the incoming origin for debugging
      console.log("Incoming origin:", origin);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Origin blocked:", origin);
        callback(new Error("Origin not allowed"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Put websocket first as it's preferred
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
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err);
});

io.on("connection", (socket) => {
  console.log("Client connected", socket.id);

  // Add error handling for individual sockets
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected", socket.id, "Reason:", reason);
  });
});

app.use("/api/tournaments", createTournamentRoutes(tournamentRepository));
app.use(
  "/api/admin",
  createAdminRoutes(tournamentRepository, currentMatchRepository, io),
);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// Anything that doesn't match the above, send back index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
});

// start the polling service
pollingService.start();

// then start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available`);
});
