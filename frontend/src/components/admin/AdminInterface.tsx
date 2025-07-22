import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import {
  ProcessedTournament,
  Division,
  RoundPairings,
  Pairing,
} from "@shared/types/tournament";
import { CurrentMatch } from "@shared/types/currentMatch";

const AdminInterface: React.FC = () => {
  const [tournaments, setTournaments] = useState<ProcessedTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedPairing, setSelectedPairing] = useState<number | null>(null);
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [availablePairings, setAvailablePairings] = useState<Pairing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationStatus, setInitializationStatus] = useState<string>("Loading tournaments...");

  const loadTournaments = async (): Promise<ProcessedTournament[]> => {
    const tournamentsData = await fetchWithAuth(`/api/tournaments/admin`);

    if (!tournamentsData || !Array.isArray(tournamentsData)) {
      throw new Error("Invalid tournaments data received");
    }

    return tournamentsData;
  };

  const loadCurrentMatch = async () => {
    try {
      const match = await fetchWithAuth(`/api/admin/match/current`);
      return match;
    } catch (error) {
      // Check if it's a "no current match" error vs a real error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("No current match found") ||
          errorMessage.includes("Request failed")) {
        console.log("No current match found");
        return null;
      } else {
        // Re-throw real errors
        throw error;
      }
    }
  };

  const applyCurrentMatchSelections = (
    match: CurrentMatch,
    tournaments: ProcessedTournament[]
  ) => {
    console.log("Current match loaded:", {
      tournament_id: match.tournament_id,
      division_id: match.division_id,
      round: match.round,
      pairing_id: match.pairing_id
    });

    const tournament = tournaments.find(
      (t: ProcessedTournament) => t.id === match.tournament_id,
    );

    if (!tournament) {
      console.warn("Tournament not found for current match ID:", match.tournament_id);
      setInitializationStatus("Current match tournament not found - starting fresh");
      return;
    }

    const divisionId = match.division_id;
    if (divisionId < 0 || divisionId >= tournament.divisions.length) {
      console.warn("Invalid division ID in current match:", divisionId);
      setInitializationStatus("Current match has invalid division - starting fresh");
      return;
    }

    // Set selections
    setSelectedTournament(match.tournament_id.toString());
    setSelectedDivision(divisionId.toString());
    setSelectedRound(match.round.toString());
    setSelectedPairing(match.pairing_id);

    // Set available rounds
    const divisionPairings = tournament.divisionPairings?.[divisionId];
    if (divisionPairings && Array.isArray(divisionPairings)) {
      const rounds = divisionPairings.map((rp: RoundPairings) => rp.round);
      setAvailableRounds(rounds);

      // Set available pairings for the current round
      const roundPairings = divisionPairings.find(
        (rp: RoundPairings) => rp.round === match.round,
      );

      if (roundPairings?.pairings) {
        setAvailablePairings(roundPairings.pairings);
      }
    }

    setInitializationStatus("Current match loaded successfully");
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
          applyCurrentMatchSelections(match, tournaments);
        } else {
          console.log("No current match found");
          setInitializationStatus("No current match found - ready for selection");
        }

      } catch (err) {
        console.error("Error during initialization:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        if (tournaments.length === 0) {
          // Failed to load tournaments - this is a critical error
          setError(`Failed to load tournaments: ${errorMessage}`);
          setInitializationStatus("Failed to load data");
        } else {
          // Tournaments loaded but current match failed - less critical
          setInitializationStatus("Could not load current match - ready for selection");
        }
      } finally {
        setIsLoading(false);
        // Clear status message after a delay
        setTimeout(() => setInitializationStatus(""), 2000);
      }
    };

    initializeData();
  }, []);

  const updateAvailableRounds = (tournamentId: string, divisionId: string) => {
    if (!tournamentId || !divisionId) {
      setAvailableRounds([]);
      return;
    }

    const tournament = tournaments.find((t) => t.id.toString() === tournamentId);
    if (!tournament?.divisionPairings) {
      setAvailableRounds([]);
      return;
    }

    const divisionPairings = tournament.divisionPairings[parseInt(divisionId)];
    if (divisionPairings && Array.isArray(divisionPairings)) {
      const rounds = divisionPairings.map((rp: RoundPairings) => rp.round);
      setAvailableRounds(rounds);
    } else {
      setAvailableRounds([]);
    }
  };

  const updateAvailablePairings = (tournamentId: string, divisionId: string, round: string) => {
    if (!tournamentId || !divisionId || !round) {
      setAvailablePairings([]);
      return;
    }

    const tournament = tournaments.find((t) => t.id.toString() === tournamentId);
    if (!tournament?.divisionPairings) {
      setAvailablePairings([]);
      return;
    }

    const divisionPairings = tournament.divisionPairings[parseInt(divisionId)];
    if (!divisionPairings) {
      setAvailablePairings([]);
      return;
    }

    const roundPairings = divisionPairings.find(
      (rp: RoundPairings) => rp.round === parseInt(round),
    );

    if (roundPairings?.pairings) {
      setAvailablePairings(roundPairings.pairings);
    } else {
      setAvailablePairings([]);
    }
  };

  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTournamentId = e.target.value;
    console.log("🔍 Tournament selection changed:", newTournamentId);

    const tournament = tournaments.find((t) => t.id.toString() === newTournamentId);
    console.log("🔍 Found tournament:", tournament?.name);
    console.log("🔍 Tournament divisions:", tournament?.divisions?.length);
    console.log("🔍 First division:", tournament?.divisions?.[0]);

    setSelectedTournament(newTournamentId);
    setSelectedDivision("");
    setSelectedRound("");
    setSelectedPairing(null);
    setAvailableRounds([]);
    setAvailablePairings([]);
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDivisionId = e.target.value;
    setSelectedDivision(newDivisionId);
    setSelectedRound("");
    setSelectedPairing(null);
    setAvailablePairings([]);

    updateAvailableRounds(selectedTournament, newDivisionId);
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRound = e.target.value;
    setSelectedRound(newRound);
    setSelectedPairing(null);

    updateAvailablePairings(selectedTournament, selectedDivision, newRound);
  };

  const handlePairingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pairingIndex = parseInt(e.target.value);
    setSelectedPairing(pairingIndex);
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
              Division
              {selectedTournament &&
                ` (${tournaments.find(t => t.id.toString() === selectedTournament)?.divisions.length || 0} available)`
              }
            </label>
            <select
              value={selectedDivision}
              onChange={handleDivisionChange}
              className={inputStyles}
              disabled={!selectedTournament || isLoading}
            >
              <option value="">Select Division</option>
              {(() => {
                if (!selectedTournament) {
                  console.log("🔍 No tournament selected");
                  return null;
                }

                const tournament = tournaments.find((t) => t.id.toString() === selectedTournament);
                console.log("🔍 Rendering divisions for tournament:", tournament?.name);
                console.log("🔍 Tournament object:", tournament);
                console.log("🔍 Divisions array:", tournament?.divisions);

                if (!tournament?.divisions) {
                  console.log("🔍 No divisions found");
                  return null;
                }

                return tournament.divisions.map((div, index) => {
                  console.log(`🔍 Division ${index}:`, div);
                  return (
                    <option key={index} value={index}>
                      {div.name}
                    </option>
                  );
                });
              })()}
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
                .map((pairing, originalIndex) => ({
                  pairing,
                  originalIndex,
                }))
                .sort((a, b) =>
                  a.pairing.player1.name.localeCompare(b.pairing.player1.name),
                )
                .map(({ pairing, originalIndex }) => (
                  <option key={originalIndex} value={originalIndex}>
                    {pairing.player1.name} vs {pairing.player2.name}
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