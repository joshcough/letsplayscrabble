const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const tournamentRoutes = require("./routes/tournaments");
const path = require("path");
const db = require("./config/database");

const app = express();
const server = http.createServer(app);

// Configure CORS for both REST and WebSocket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("Client connected", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Routes
app.get("/api/divisions", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM divisions ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching divisions:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/players/:divisionId", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM players WHERE division_id = $1 ORDER BY name",
      [req.params.divisionId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching players:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/match/current", async (req, res) => {
  const { player1Id, player2Id, divisionId } = req.body;
  try {
    // First get the players
    const playersResult = await db.query(
      "SELECT * FROM players WHERE id IN ($1, $2)",
      [player1Id, player2Id],
    );

    // Then update the current match
    const matchResult = await db.query(
      "INSERT INTO current_matches (player1_id, player2_id, division_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET player1_id = $1, player2_id = $2, division_id = $3 RETURNING *",
      [player1Id, player2Id, divisionId],
    );

    const matchData = {
      ...matchResult.rows[0],
      players: playersResult.rows,
    };

    console.log("Emitting matchUpdate with data:", matchData);
    io.emit("matchUpdate", matchData);
    res.json(matchData);
  } catch (err) {
    console.error("Error updating match:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/tournaments", tournamentRoutes);

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
