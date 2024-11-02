import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";

const AdminInterface = () => {
  const [divisions, setDivisions] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState({
    player1: "",
    player2: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      // Find the tournament object from tournaments array
      const selectedTourneyObj = tournaments.find(t => t.id.toString() === selectedTournament);
      // Set its divisions (if the tournament is found)
      setDivisions(selectedTourneyObj?.divisions || []);
    } else {
      setDivisions([]);
    }
  }, [selectedTournament]);

  useEffect(() => {
    if (selectedDivision) {
      // Find the tournament object from tournaments array
      const selectedTourneyObj = tournaments.find(t => t.id.toString() === selectedTournament);
      const selectedDivisionObj =  selectedTourneyObj.divisions[selectedDivision]
      setPlayers(selectedDivisionObj.players.slice(1))
    } else {
      setPlayers([]);
    }
  }, [selectedDivision]);

  useEffect(() => {
    console.log("players updated:", players);
  }, [players]);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/tournaments`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tournaments");
      }

      setTournaments(data);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      setError("Failed to fetch Tournaments. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentMatch = async () => {
    if (!selectedPlayers.player1 || !selectedPlayers.player2) {
      setError("Please select both players");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending match update:", {
        player1Id: selectedPlayers.player1,
        player2Id: selectedPlayers.player2,
        divisionId: selectedDivision,
        tournamentId: selectedTournament,
      });

      const response = await fetch(`${API_BASE}/api/match/current`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Id: selectedPlayers.player1,
          player2Id: selectedPlayers.player2,
          divisionId: selectedDivision,
          tournamentId: selectedTournament,
        }),
      });

      const data = await response.json();
      console.log("Match update response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to update match");
      }

      setError(null);
      setSuccess("Match updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating match:", err);
      setError(err.message || "Failed to update match");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Tournament Admin Panel</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Division</label>
            <select
              value={selectedTournament}
              onChange={(e) => {
                setSelectedTournament(e.target.value)
              }}
              className="w-full border rounded-md p-2"
              disabled={isLoading}
            >
              <option value="">Select Tournament</option>
              {[...tournaments]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t, index) => {
                  return (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full border rounded-md p-2"
                disabled={!selectedTournament || isLoading}
              >
                <option value="">Select Division</option>
                {divisions.map((div, index) => (
                  <option key={index} value={index}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Player 1</label>
              <select
                value={selectedPlayers.player1}
                onChange={(e) =>
                  setSelectedPlayers((prev) => ({
                    ...prev,
                    player1: e.target.value,
                  }))
                }
                className="w-full border rounded-md p-2"
                disabled={!selectedDivision || isLoading}
              >
                <option value="">Select Player</option>
              {[...players]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((player, index) => {
                  return (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  );
                })}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium mb-2">Player 2</label>
              <select
                value={selectedPlayers.player2}
                onChange={(e) =>
                  setSelectedPlayers((prev) => ({
                    ...prev,
                    player2: e.target.value,
                  }))
                }
                className="w-full border rounded-md p-2"
                disabled={!selectedDivision || isLoading}
              >
                <option value="">Select Player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={updateCurrentMatch}
            disabled={
              isLoading || !selectedPlayers.player1 || !selectedPlayers.player2
            }
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              isLoading || !selectedPlayers.player1 || !selectedPlayers.player2
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isLoading ? "Updating..." : "Update Match"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminInterface;
