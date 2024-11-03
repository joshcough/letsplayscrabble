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

  // Initial data loading
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tournaments
        const tournamentsResponse = await fetch(`${API_BASE}/api/tournaments`);
        if (!tournamentsResponse.ok) {
          throw new Error("Failed to fetch tournaments");
        }
        const tournamentsData = await tournamentsResponse.json();
        setTournaments(tournamentsData);

        // Fetch current match
        const matchResponse = await fetch(
          `${API_BASE}/api/admin/match/current`,
        );
        const currentMatch = await matchResponse.json();

        // Only proceed if we have match data
        if (currentMatch.matchData) {
          const tourneyObj = tournamentsData.find(
            (t) => t.id === currentMatch.matchData.tournament_id,
          );

          if (tourneyObj) {
            const divisionObj =
              tourneyObj.divisions[currentMatch.matchData.division_id];

            setSelectedTournament(
              currentMatch.matchData.tournament_id.toString(),
            );
            setSelectedDivision(currentMatch.matchData.division_id.toString());
            setDivisions(tourneyObj.divisions);
            setPlayers(divisionObj.players.slice(1));
            setSelectedPlayers({
              player1: currentMatch.matchData.player1_id.toString(),
              player2: currentMatch.matchData.player2_id.toString(),
            });
          }
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Failed to load initial data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleTournamentChange = (e) => {
    const newTournamentId = e.target.value;
    setSelectedTournament(newTournamentId);

    // Clear division and player selections
    setSelectedDivision("");
    setSelectedPlayers({ player1: "", player2: "" });

    // Update divisions list
    if (newTournamentId === "") {
      setDivisions([]);
      setPlayers([]);
    } else {
      const tourneyObj = tournaments.find(
        (t) => t.id.toString() === newTournamentId,
      );
      if (tourneyObj) {
        setDivisions(tourneyObj.divisions || []);
      }
    }
  };

  const handleDivisionChange = (e) => {
    const newDivisionId = e.target.value;
    setSelectedDivision(newDivisionId);

    // Clear player selections
    setSelectedPlayers({ player1: "", player2: "" });

    // Update players list
    if (newDivisionId === "" || selectedTournament === "") {
      setPlayers([]);
    } else {
      const tourneyObj = tournaments.find(
        (t) => t.id.toString() === selectedTournament,
      );
      if (tourneyObj && tourneyObj.divisions[newDivisionId]) {
        setPlayers(tourneyObj.divisions[newDivisionId].players.slice(1));
      }
    }
  };

  const updateCurrentMatch = async () => {
    if (!selectedPlayers.player1 || !selectedPlayers.player2) {
      setError("Please select both players");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/match/current`, {
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to update match");
      }

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
            <label className="block text-sm font-medium mb-2">Tournament</label>
            <select
              value={selectedTournament}
              onChange={handleTournamentChange}
              className="w-full border rounded-md p-2"
              disabled={isLoading}
            >
              <option value="">Select Tournament</option>
              {[...tournaments]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Division</label>
            <select
              value={selectedDivision}
              onChange={handleDivisionChange}
              className="w-full border rounded-md p-2"
              disabled={selectedTournament === "" || isLoading}
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
                disabled={selectedDivision === "" || isLoading}
              >
                <option value="">Select Player</option>
                {[...players]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
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
                disabled={selectedDivision === "" || isLoading}
              >
                <option value="">Select Player</option>
                {[...players]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
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
  );
};

export default AdminInterface;
