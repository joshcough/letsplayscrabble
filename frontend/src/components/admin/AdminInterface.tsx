import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import { CurrentMatch } from "@shared/types/currentMatch";
import { TournamentRow, DivisionRow, PlayerRow, GameRow, Tournament } from "@shared/types/database";

// UI types for transformed dropdown data
interface PairingOption {
  pairingId: number;
  player1Name: string;
  player2Name: string;
}

const AdminInterface: React.FC = () => {
  // State for dropdown options
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [completeTournament, setCompleteTournament] = useState<Tournament | null>(null);

  // State for selections
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedPairing, setSelectedPairing] = useState<number | null>(null);

  // Computed dropdown data
  const [availableDivisions, setAvailableDivisions] = useState<DivisionRow[]>([]);
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [availablePairings, setAvailablePairings] = useState<PairingOption[]>([]);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationStatus, setInitializationStatus] = useState<string>("Loading tournaments...");

  const loadTournaments = async (): Promise<TournamentRow[]> => {
    const tournamentsData = await fetchWithAuth(`/api/tournaments/list`);
    if (!tournamentsData || !Array.isArray(tournamentsData)) {
      throw new Error("Invalid tournaments data received");
    }
    return tournamentsData;
  };

  const loadCompleteTournament = async (tournamentId: number): Promise<Tournament> => {
    const tournament = await fetchWithAuth(`/api/tournaments/${tournamentId}/complete`);
    if (!tournament) {
      throw new Error("Failed to load tournament data");
    }
    return tournament;
  };

  const loadCurrentMatch = async (): Promise<CurrentMatch | null> => {
    try {
      const match = await fetchWithAuth(`/api/admin/match/current`);
      return match;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("No current match found") ||
          errorMessage.includes("Request failed")) {
        return null;
      }
      throw error;
    }
  };

  // Transform complete tournament data into dropdown options
  const updateDropdownData = (tournament: Tournament, divisionId?: number, round?: number) => {
    // Set available divisions
    setAvailableDivisions(tournament.divisions);

    if (divisionId !== undefined) {
      // Get rounds for this division
      const divisionGames = tournament.games.filter(game => game.division_id === divisionId);
      const rounds = Array.from(new Set(divisionGames.map(game => game.round_number))).sort((a, b) => a - b);
      setAvailableRounds(rounds);

      if (round !== undefined) {
        // Get pairings for this division and round
        const roundGames = divisionGames.filter(game => game.round_number === round);

        const pairings = roundGames.map(game => {
          const player1 = tournament.players.find(p => p.id === game.player1_id);
          const player2 = tournament.players.find(p => p.id === game.player2_id);

          return {
            pairingId: game.pairing_id || 0,
            player1Name: player1?.name || "Unknown",
            player2Name: player2?.name || "Unknown"
          };
        });

        setAvailablePairings(pairings);
      } else {
        setAvailablePairings([]);
      }
    } else {
      setAvailableRounds([]);
      setAvailablePairings([]);
    }
  };

  const applyCurrentMatchSelections = async (match: CurrentMatch) => {
    console.log("Current match loaded:", match);

    // Load the complete tournament data for this match
    try {
      const tournament = await loadCompleteTournament(match.tournament_id);
      setCompleteTournament(tournament);

      // Find the division
      const division = tournament.divisions.find(d => d.id === match.division_id);
      if (!division) {
        console.warn("Division not found for current match:", match.division_id);
        setInitializationStatus("Current match has invalid division - starting fresh");
        return;
      }

      // Set selections
      setSelectedTournament(match.tournament_id.toString());
      setSelectedDivision(match.division_id.toString());
      setSelectedRound(match.round.toString());
      setSelectedPairing(match.pairing_id);

      // Update dropdown data
      updateDropdownData(tournament, match.division_id, match.round);

      setInitializationStatus("Current match loaded successfully");
    } catch (error) {
      console.error("Error loading tournament for current match:", error);
      setInitializationStatus("Could not load tournament data - starting fresh");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Load tournaments
        setInitializationStatus("Loading tournaments...");
        const tournaments = await loadTournaments();
        setTournaments(tournaments);

        setInitializationStatus("Tournaments loaded. Checking for current match...");

        // Step 2: Try to load current match
        const match = await loadCurrentMatch();

        if (match?.tournament_id) {
          setInitializationStatus("Loading current match selections...");
          await applyCurrentMatchSelections(match);
        } else {
          console.log("No current match found");
          setInitializationStatus("No current match found - ready for selection");
        }

      } catch (err) {
        console.error("Error during initialization:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        if (tournaments.length === 0) {
          setError(`Failed to load tournaments: ${errorMessage}`);
          setInitializationStatus("Failed to load data");
        } else {
          setInitializationStatus("Could not load current match - ready for selection");
        }
      } finally {
        setIsLoading(false);
        setTimeout(() => setInitializationStatus(""), 2000);
      }
    };

    initializeData();
  }, []);

  const handleTournamentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTournamentId = e.target.value;
    console.log("Tournament selection changed:", newTournamentId);

    setSelectedTournament(newTournamentId);
    setSelectedDivision("");
    setSelectedRound("");
    setSelectedPairing(null);
    setAvailableDivisions([]);
    setAvailableRounds([]);
    setAvailablePairings([]);

    if (newTournamentId) {
      try {
        setIsLoading(true);
        const tournament = await loadCompleteTournament(parseInt(newTournamentId));
        setCompleteTournament(tournament);
        updateDropdownData(tournament);
      } catch (error) {
        console.error("Error loading tournament:", error);
        setError("Failed to load tournament data");
      } finally {
        setIsLoading(false);
      }
    } else {
      setCompleteTournament(null);
    }
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDivisionId = e.target.value;
    setSelectedDivision(newDivisionId);
    setSelectedRound("");
    setSelectedPairing(null);

    if (completeTournament && newDivisionId) {
      updateDropdownData(completeTournament, parseInt(newDivisionId));
    }
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRound = e.target.value;
    setSelectedRound(newRound);
    setSelectedPairing(null);

    if (completeTournament && selectedDivision && newRound) {
      updateDropdownData(completeTournament, parseInt(selectedDivision), parseInt(newRound));
    }
  };

  const handlePairingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pairingId = parseInt(e.target.value);
    setSelectedPairing(pairingId);
  };

  const updateCurrentMatch = async () => {
    if (selectedPairing === null) {
      setError("Please select a pairing");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestBody: CurrentMatch = {
        tournament_id: parseInt(selectedTournament),
        division_id: parseInt(selectedDivision),
        round: parseInt(selectedRound),
        pairing_id: selectedPairing,
      };

      console.log("Updating current match:", requestBody);

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

  // Show loading state during initialization
  if (isLoading && tournaments.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-[#FAF1DB] shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-[#4A3728]">
            Tournament Admin Panel
          </h1>
          <div className="flex items-center justify-center py-8">
            <div className="text-[#4A3728]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A3728] mx-auto mb-4"></div>
              <p>{initializationStatus}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {initializationStatus && (
          <div className="border-2 border-blue-700/20 bg-blue-700/10 text-blue-700 px-4 py-3 rounded mb-4">
            {initializationStatus}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-[#4A3728] font-medium mb-2">
              Tournament ({tournaments.length} available)
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
                    {t.long_form_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[#4A3728] font-medium mb-2">
              Division ({availableDivisions.length} available)
            </label>
            <select
              value={selectedDivision}
              onChange={handleDivisionChange}
              className={inputStyles}
              disabled={!selectedTournament || isLoading}
            >
              <option value="">Select Division</option>
              {availableDivisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#4A3728] font-medium mb-2">
              Round ({availableRounds.length} available)
            </label>
            <select
              value={selectedRound}
              onChange={handleRoundChange}
              className={inputStyles}
              disabled={!selectedDivision || isLoading}
            >
              <option value="">Select Round</option>
              {availableRounds.map((round) => (
                <option key={round} value={round}>
                  Round {round}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#4A3728] font-medium mb-2">
              Pairing ({availablePairings.length} available)
            </label>
            <select
              value={selectedPairing !== null ? selectedPairing.toString() : ""}
              onChange={handlePairingChange}
              className={inputStyles}
              disabled={!selectedRound || isLoading}
            >
              <option value="">Select Pairing</option>
              {availablePairings
                .sort((a, b) => a.player1Name.localeCompare(b.player1Name))
                .map((pairing) => (
                  <option key={pairing.pairingId} value={pairing.pairingId}>
                    {pairing.player1Name} vs {pairing.player2Name}
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={updateCurrentMatch}
            disabled={isLoading || selectedPairing === null}
            className={`w-full py-2 px-4 rounded-md transition-colors
              ${
                isLoading || selectedPairing === null
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