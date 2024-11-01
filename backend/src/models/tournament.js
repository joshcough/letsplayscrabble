// backend/models/tournament.js
const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  year: { type: Number, required: true },
  lexicon: { type: String, required: true },
  longFormName: { type: String, required: true },
  dataUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tournament", tournamentSchema);
