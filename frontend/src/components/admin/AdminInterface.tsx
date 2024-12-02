import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import { ProcessedTournament, Division, Player } from "@shared/types/tournament";
import { CurrentMatch, CreateCurrentMatchParams } from "@shared/types/currentMatch";

const AdminInterface: React.FC = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [tournaments, setTournaments] = useState<ProcessedTournament[]>([]);
  const [players, setPlayers] = useState<(Player | null)[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState({
    player1: "",
    player2: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tournaments
        const tournamentsData = await fetchWithAuth(`/api/tournaments`);
        setTournaments(tournamentsData);

        // Fetch current match
        const currentMatch = await fetchWithAuth(`/api/overlay/match/current`);

        // Only proceed if we have match data
        if (currentMatch.matchData) {
          const tourneyObj = tournamentsData.find(
            (t) => t.id === currentMatch.matchData.tournament_id
          );

          if (tourneyObj) {
            const divisionObj = tourneyObj.divisions[currentMatch.matchData.division_id];

            setSelectedTournament(currentMatch.matchData.tournament_id.toString());
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

  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
        (t) => t.id.toString() === newTournamentId
      );
      if (tourneyObj) {
        setDivisions(tourneyObj.divisions || []);
      }
    }
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDivisionId = e.target.value;
    setSelectedDivision(newDivisionId);

    // Clear player selections
    setSelectedPlayers({ player1: "", player2: "" });

    // Update players list
    if (newDivisionId === "" || selectedTournament === "") {
      setPlayers([]);
    } else {
      const tourneyObj = tournaments.find(
        (t) => t.id.toString() === selectedTournament
      );
      if (tourneyObj && tourneyObj.divisions[parseInt(newDivisionId)]) {
        setPlayers(tourneyObj.divisions[parseInt(newDivisionId)].players.slice(1));
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
      const requestBody: CreateCurrentMatchParams = {
        player1Id: parseInt(selectedPlayers.player1),
        player2Id: parseInt(selectedPlayers.player2),
        divisionId: parseInt(selectedDivision),
        tournamentId: parseInt(selectedTournament),
      };

      await fetchWithAuth(`/api/admin/match/current`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      setSuccess("Match updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating match:", err);
      setError(err instanceof Error ? err.message : "Failed to update match");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = `
    w-full p-2 border-2 border-[#4A3728]/20 rounded
    bg-[#FFF8E7] text-[#4A3728]
    focus:ring-2 focus:ring-[#4A3728]/30 focus:border-[#4A3728]
    outline-none transition-colors
    disabled:bg-[#4A3728]/10 disabled:cursor-not-allowed
  `;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-[#FAF1DB] shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-[#4A3728]">
          Tournament Admin Panel
        </h1>

        {error && (
          <div className="border-2 border-red-700/20 bg-red-700/10 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="border-2 border-green-700/20 bg-green-700/10 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-[#4A3728] font-medium mb-2">
              Tournament
            </label>
            <select
              value={selectedTournament}
              onChange={handleTournamentChange}
              className={inputStyles}
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
            <label className="block text-[#4A3728] font-medium mb-2">
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={handleDivisionChange}
              className={inputStyles}
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
              <label className="block text-[#4A3728] font-medium mb-2">
                Player 1
              </label>
              <select
                value={selectedPlayers.player1}
                onChange={(e) =>
                  setSelectedPlayers((prev) => ({
                    ...prev,
                    player1: e.target.value,
                  }))
                }
                className={inputStyles}
                disabled={selectedDivision === "" || isLoading}
              >
                <option value="">Select Player</option>
                {[...players]
                  .filter((p): p is Player => p !== null)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[#4A3728] font-medium mb-2">
                Player 2
              </label>
              <select
                value={selectedPlayers.player2}
                onChange={(e) =>
                  setSelectedPlayers((prev) => ({
                    ...prev,
                    player2: e.target.value,
                  }))
                }
                className={inputStyles}
                disabled={selectedDivision === "" || isLoading}
              >
                <option value="">Select Player</option>
                {[...players]
                  .filter((p): p is Player => p !== null)
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
            className={`w-full py-2 px-4 rounded-md transition-colors
              ${
                isLoading ||
                !selectedPlayers.player1 ||
                !selectedPlayers.player2
                  ? "bg-[#4A3728]/40 text-[#4A3728]/60 cursor-not-allowed"
                  : "bg-[#4A3728] hover:bg-[#6B5744] text-[#FAF1DB] shadow-md border-2 border-[#4A3728]"
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