import React, { useState, useEffect } from "react";

import * as Domain from "@shared/types/domain";

import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";
import { ApiService } from "../../services/interfaces";
import { ProtectedPage } from "../ProtectedPage";

// UI types for transformed dropdown data
interface PairingOption {
  pairingId: number;
  player1Name: string;
  player2Name: string;
}

const AdminInterface: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { userId } = useAuth(); // Get userId from auth context
  const { theme } = useThemeContext();
  const user_id = userId!;

  // State for dropdown options
  const [tournaments, setTournaments] = useState<Domain.TournamentSummary[]>(
    [],
  );
  const [hierarchicalTournament, setHierarchicalTournament] =
    useState<Domain.Tournament | null>(null);

  // State for selections
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedPairing, setSelectedPairing] = useState<number | null>(null);

  // Computed dropdown data
  const [availableDivisions, setAvailableDivisions] = useState<
    Domain.Division[]
  >([]);
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

  const loadTournaments = async (): Promise<Domain.TournamentSummary[]> => {
    const response = await apiService.listTournaments();
    return response.success ? response.data : [];
  };

  const loadCurrentMatch = async (): Promise<Domain.CurrentMatch | null> => {
    const response = await apiService.getCurrentMatch(user_id);
    return response.success ? response.data : null;
  };

  // UPDATED: Transform hierarchical tournament data into dropdown options
  const updateDropdownData = (
    tournament: Domain.Tournament,
    divisionId?: number,
    round?: number,
  ) => {
    // Set available divisions from hierarchical structure
    // Use domain divisions directly
    setAvailableDivisions(tournament.divisions);

    if (divisionId !== undefined) {
      // Find the specific division in the hierarchical structure
      const divisionData = tournament.divisions.find(
        (d) => d.id === divisionId,
      );

      if (divisionData) {
        // Get rounds for this division from its games
        const rounds = Array.from(
          new Set(divisionData.games.map((game) => game.roundNumber)),
        ).sort((a, b) => a - b);
        setAvailableRounds(rounds);

        if (round !== undefined) {
          // Get pairings for this division and round
          const roundGames = divisionData.games.filter(
            (game) => game.roundNumber === round,
          );

          const pairings = roundGames.map((game) => {
            const player1 = divisionData.players.find(
              (p) => p.id === game.player1Id,
            );
            const player2 = divisionData.players.find(
              (p) => p.id === game.player2Id,
            );

            return {
              pairingId: game.pairingId || 0,
              player1Name: player1?.name || "Unknown",
              player2Name: game.isBye ? "BYE" : (player2?.name || "Unknown"),
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

  const applyCurrentMatchSelections = async (match: Domain.CurrentMatch) => {
    console.log("Current match loaded:", match);

    // Load the hierarchical tournament data for this match
    try {
      const tournamentResponse = await apiService.getTournament(
        user_id,
        match.tournamentId,
      );
      if (!tournamentResponse.success) {
        throw new Error(tournamentResponse.error);
      }
      const tournament = tournamentResponse.data;
      console.log("✅ Loaded tournament with V2 API:", tournament);

      setHierarchicalTournament(tournament);

      // Find the division in hierarchical structure
      const divisionData = tournament.divisions.find(
        (d) => d.id === match.divisionId,
      );
      if (!divisionData) {
        console.warn("Division not found for current match:", match.divisionId);
        setInitializationStatus(
          "Current match has invalid division - starting fresh",
        );
        return;
      }

      // Set selections
      setSelectedTournament(match.tournamentId.toString());
      setSelectedDivision(match.divisionId.toString());
      setSelectedRound(match.round.toString());
      setSelectedPairing(match.pairingId);

      // Update dropdown data
      updateDropdownData(tournament, match.divisionId, match.round);

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

        if (match?.tournamentId) {
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
        const tournamentResponse = await apiService.getTournament(
          user_id,
          parseInt(newTournamentId),
        );
        if (!tournamentResponse.success) {
          throw new Error(tournamentResponse.error);
        }
        const tournament = tournamentResponse.data;
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
      const requestBody: Domain.CreateCurrentMatch = {
        tournamentId: parseInt(selectedTournament),
        divisionId: parseInt(selectedDivision),
        round: parseInt(selectedRound),
        pairingId: selectedPairing,
      };

      console.log("Updating current match:", requestBody);

      const setMatchResponse = await apiService.setCurrentMatch(requestBody);
      if (!setMatchResponse.success) {
        throw new Error(setMatchResponse.error);
      }

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
    w-full p-2 border-2 ${theme.colors.secondaryBorder} rounded
    ${theme.colors.cardBackground} ${theme.colors.textPrimary}
    focus:ring-2 ${theme.colors.ringColor} focus:${theme.colors.primaryBorder}
    outline-none transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Show loading state during initialization
  if (isLoading && tournaments.length === 0) {
    return (
      <ProtectedPage>
        <div className="p-8 max-w-4xl mx-auto">
          <div className={`${theme.colors.cardBackground} shadow-md rounded-lg p-6`}>
            <h1 className={`text-2xl font-bold mb-6 ${theme.colors.textPrimary}`}>
              Tournament Admin Panel
            </h1>
            <div className="flex items-center justify-center py-8">
              <div className={theme.colors.textPrimary}>
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
        <div className={`${theme.colors.cardBackground} shadow-md rounded-lg p-6`}>
          <h1 className={`text-2xl font-bold mb-6 ${theme.colors.textPrimary}`}>
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
              <label className={`block ${theme.colors.textPrimary} font-medium mb-2`}>
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
                      {t.longFormName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className={`block ${theme.colors.textPrimary} font-medium mb-2`}>
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
              <label className={`block ${theme.colors.textPrimary} font-medium mb-2`}>
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
              <label className={`block ${theme.colors.textPrimary} font-medium mb-2`}>
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
                    ? `${theme.colors.cardBackground} opacity-50 cursor-not-allowed`
                    : `${theme.colors.cardBackground} ${theme.colors.hoverBackground} ${theme.colors.textPrimary} ${theme.colors.shadowColor} shadow-md border-2 ${theme.colors.primaryBorder}`
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
