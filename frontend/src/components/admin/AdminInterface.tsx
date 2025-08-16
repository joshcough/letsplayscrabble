import React, { useState, useEffect } from "react";

import { CreateCurrentMatch, CurrentMatch } from "@shared/types/currentMatch";
import {
  TournamentRow,
  DivisionRow,
  PlayerRow,
  GameRow,
  Tournament,
} from "@shared/types/database";

import { useAuth } from "../../context/AuthContext";
import {
  fetchTournament,
  fetchApiResponseWithAuth,
  setCurrentMatch,
  listTournaments,
} from "../../services/api";
import { ProtectedPage } from "../ProtectedPage";

// UI types for transformed dropdown data
interface PairingOption {
  pairingId: number;
  player1Name: string;
  player2Name: string;
}

const AdminInterface: React.FC = () => {
  const { userId } = useAuth(); // Get userId from auth context
  const user_id = userId!;

  // State for dropdown options
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [hierarchicalTournament, setHierarchicalTournament] =
    useState<Tournament | null>(null);

  // State for selections
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedPairing, setSelectedPairing] = useState<number | null>(null);

  // Computed dropdown data
  const [availableDivisions, setAvailableDivisions] = useState<DivisionRow[]>(
    [],
  );
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [availablePairings, setAvailablePairings] = useState<PairingOption[]>(
    [],
  );

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationStatus, setInitializationStatus] = useState<string>(
    "Loading tournaments...",
  );

  const loadTournaments = async (): Promise<TournamentRow[]> => {
    return await listTournaments();
  };

  const loadCurrentMatch = async (): Promise<CurrentMatch | null> => {
    const response = await fetchApiResponseWithAuth<CurrentMatch>(
      `/api/admin/match/current`,
    );
    return response.success ? response.data : null;
  };

  // UPDATED: Transform hierarchical tournament data into dropdown options
  const updateDropdownData = (
    tournament: Tournament,
    divisionId?: number,
    round?: number,
  ) => {
    // Set available divisions from hierarchical structure
    setAvailableDivisions(tournament.divisions.map((d) => d.division));

    if (divisionId !== undefined) {
      // Find the specific division in the hierarchical structure
      const divisionData = tournament.divisions.find(
        (d) => d.division.id === divisionId,
      );

      if (divisionData) {
        // Get rounds for this division from its games
        const rounds = Array.from(
          new Set(divisionData.games.map((game) => game.round_number)),
        ).sort((a, b) => a - b);
        setAvailableRounds(rounds);

        if (round !== undefined) {
          // Get pairings for this division and round
          const roundGames = divisionData.games.filter(
            (game) => game.round_number === round,
          );

          const pairings = roundGames.map((game) => {
            const player1 = divisionData.players.find(
              (p) => p.id === game.player1_id,
            );
            const player2 = divisionData.players.find(
              (p) => p.id === game.player2_id,
            );

            return {
              pairingId: game.pairing_id || 0,
              player1Name: player1?.name || "Unknown",
              player2Name: player2?.name || "Unknown",
            };
          });

          setAvailablePairings(pairings);
        } else {
          setAvailablePairings([]);
        }
      } else {
        console.warn("Division not found in hierarchical data:", divisionId);
        setAvailableRounds([]);
        setAvailablePairings([]);
      }
    } else {
      setAvailableRounds([]);
      setAvailablePairings([]);
    }
  };

  const applyCurrentMatchSelections = async (match: CurrentMatch) => {
    console.log("Current match loaded:", match);

    // Load the hierarchical tournament data for this match
    try {
      const tournament = await fetchTournament(user_id, match.tournament_id);
      
      // TEST: Also fetch with V2 to compare
      try {
        const { fetchTournamentV2 } = await import('../../services/api');
        const tournamentV2 = await fetchTournamentV2(user_id, match.tournament_id);
        console.log('🆚 COMPARISON - Old API vs V2 API:');
        console.log('Old API (flat structure):', tournament);
        console.log('V2 API (domain model):', tournamentV2);
      } catch (v2Error) {
        console.error('❌ V2 API test failed:', v2Error);
      }

      setHierarchicalTournament(tournament);

      // Find the division in hierarchical structure
      const divisionData = tournament.divisions.find(
        (d) => d.division.id === match.division_id,
      );
      if (!divisionData) {
        console.warn(
          "Division not found for current match:",
          match.division_id,
        );
        setInitializationStatus(
          "Current match has invalid division - starting fresh",
        );
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
      setInitializationStatus(
        "Could not load tournament data - starting fresh",
      );
    }
  };

  useEffect(() => {
    // Don't initialize if userId is not available yet
    if (!userId) return;

    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Load tournaments
        setInitializationStatus("Loading tournaments...");
        const tournaments = await loadTournaments();
        setTournaments(tournaments);

        setInitializationStatus(
          "Tournaments loaded. Checking for current match...",
        );

        // Step 2: Try to load current match
        const match = await loadCurrentMatch();

        if (match?.tournament_id) {
          setInitializationStatus("Loading current match selections...");
          await applyCurrentMatchSelections(match);
        } else {
          console.log("No current match found");
          setInitializationStatus(
            "No current match found - ready for selection",
          );
        }
      } catch (err) {
        console.error("Error during initialization:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        if (tournaments.length === 0) {
          setError(`Failed to load tournaments: ${errorMessage}`);
          setInitializationStatus("Failed to load data");
        } else {
          setInitializationStatus(
            "Could not load current match - ready for selection",
          );
        }
      } finally {
        setIsLoading(false);
        setTimeout(() => setInitializationStatus(""), 2000);
      }
    };

    initializeData();
  }, [userId]); // Add userId as dependency

  const handleTournamentChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
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
        const tournament = await fetchTournament(
          user_id,
          parseInt(newTournamentId),
        );
        setHierarchicalTournament(tournament);
        updateDropdownData(tournament);
      } catch (error) {
        console.error("Error loading tournament:", error);
        setError("Failed to load tournament data");
      } finally {
        setIsLoading(false);
      }
    } else {
      setHierarchicalTournament(null);
    }
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDivisionId = e.target.value;
    setSelectedDivision(newDivisionId);
    setSelectedRound("");
    setSelectedPairing(null);

    if (hierarchicalTournament && newDivisionId) {
      updateDropdownData(hierarchicalTournament, parseInt(newDivisionId));
    }
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRound = e.target.value;
    setSelectedRound(newRound);
    setSelectedPairing(null);

    if (hierarchicalTournament && selectedDivision && newRound) {
      updateDropdownData(
        hierarchicalTournament,
        parseInt(selectedDivision),
        parseInt(newRound),
      );
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
      const requestBody: CreateCurrentMatch = {
        tournament_id: parseInt(selectedTournament),
        division_id: parseInt(selectedDivision),
        round: parseInt(selectedRound),
        pairing_id: selectedPairing,
      };

      console.log("Updating current match:", requestBody);

      await setCurrentMatch(requestBody);

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
      <ProtectedPage>
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
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
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
                value={
                  selectedPairing !== null ? selectedPairing.toString() : ""
                }
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
    </ProtectedPage>
  );
};

export default AdminInterface;
