const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const db = require("./config/database");
const data = require("./services/dataProcessing");
const TournamentRepository = require('./repositories/tournaments');
const createTournamentRoutes = require("./routes/tournaments");

const app = express();
const server = http.createServer(app);

const tournamentRepository = new TournamentRepository(db.pool);
const tournamentRouter = createTournamentRoutes(tournamentRepository);

// Configure CORS for both REST and WebSocket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({
  origin: "http://localhost:3000",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
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

app.post("/api/match/current", async (req, res) => {
  const { player1Id, player2Id, divisionId, tournamentId } = req.body;

  try {
    const matchResult = await db.query(
      `INSERT INTO current_matches (player1_id, player2_id, division_id, tournament_id) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET player1_id = $1, player2_id = $2, division_id = $3, tournament_id = $4
       RETURNING *`,
      [player1Id, player2Id, divisionId, tournamentId],
    );

    const player1Stats = await tournamentRepository.findPlayerStats(tournamentId, divisionId, player1Id)
    const player2Stats = await tournamentRepository.findPlayerStats(tournamentId, divisionId, player2Id)

    const matchData = {
      ...matchResult.rows[0],
      players: [player1Stats, player2Stats],
    };

    console.log("Emitting matchUpdate with data:", matchData);
    io.emit("matchUpdate", matchData);
    res.json(matchData);
  } catch (err) {
    console.error("Error updating match:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/tournaments", tournamentRouter);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// Anything that doesn't match the above, send back index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available`);
});
