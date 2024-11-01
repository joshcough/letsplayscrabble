// backend/models/round.js
const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
  },
  roundId: { type: Number, required: true },
  tableId: { type: Number, required: true },
  roundData: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Round", roundSchema);
