import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../config/api";
import {
  ProcessedTournament,
  Division,
  RoundPairings,
  Pairing,
} from "@shared/types/tournament";
import { CreateCurrentMatchParams } from "@shared/types/currentMatch";

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tournaments first
        const tournamentsData = await fetchWithAuth(`/api/tournaments/public`);
        setTournaments(tournamentsData);

        try {
          // Try to fetch current match - but don't break if it fails
          const currentMatchResponse = await fetchWithAuth(
            `/api/overlay/match/current`,
          );

          if (currentMatchResponse && currentMatchResponse.matchData) {
            const tourneyObj = tournamentsData.find(
              (t: ProcessedTournament) =>
                t.id === currentMatchResponse.matchData.tournament_id,
            );

            if (tourneyObj) {
              setSelectedTournament(
                currentMatchResponse.matchData.tournament_id.toString(),
              );
              setSelectedDivision(
                currentMatchResponse.matchData.division_id.toString(),
              );
              setSelectedRound(currentMatchResponse.matchData.round.toString());
              setSelectedPairing(currentMatchResponse.matchData.pairing_id);

              const divisionPairings =
                tourneyObj.divisionPairings[
                  currentMatchResponse.matchData.division_id
                ];
              const rounds = divisionPairings.map(
                (rp: RoundPairings) => rp.round,
              );
              setAvailableRounds(rounds);

              const roundPairings = divisionPairings.find(
                (rp: RoundPairings) =>
                  rp.round === currentMatchResponse.matchData.round,
              );
              if (roundPairings) {
                setAvailablePairings(roundPairings.pairings);
              }
            }
          }
        } catch (matchError) {
          // If current match fetch fails, just log it and continue
          console.error("Error fetching current match:", matchError);
          // Don't set error state - let the user proceed with empty selections
        }
      } catch (err) {
        console.error("Error loading tournaments:", err);
        setError("Failed to load tournaments. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTournamentId = e.target.value;
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

    if (newDivisionId && selectedTournament) {
      const tournament = tournaments.find(
        (t) => t.id.toString() === selectedTournament,
      );
      if (tournament) {
        const divisionPairings =
          tournament.divisionPairings[parseInt(newDivisionId)];
        const rounds = divisionPairings.map((rp: RoundPairings) => rp.round);
        setAvailableRounds(rounds);
      }
    } else {
      setAvailableRounds([]);
    }
    setAvailablePairings([]);
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRound = e.target.value;
    setSelectedRound(newRound);
    setSelectedPairing(null);

    if (newRound && selectedDivision && selectedTournament) {
      const tournament = tournaments.find(
        (t) => t.id.toString() === selectedTournament,
      );
      if (tournament) {
        const divisionPairings =
          tournament.divisionPairings[parseInt(selectedDivision)];
        const roundPairings = divisionPairings.find(
          (rp: RoundPairings) => rp.round === parseInt(newRound),
        );
        if (roundPairings) {
          setAvailablePairings(roundPairings.pairings);
        }
      }
    } else {
      setAvailablePairings([]);
    }
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

    try {
      const requestBody: CreateCurrentMatchParams = {
        tournamentId: parseInt(selectedTournament),
        divisionId: parseInt(selectedDivision),
        round: parseInt(selectedRound),
        pairingId: selectedPairing,
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
              disabled={!selectedTournament || isLoading}
            >
              <option value="">Select Division</option>
              {selectedTournament &&
                tournaments
                  .find((t) => t.id.toString() === selectedTournament)
                  ?.divisions.map((div, index) => (
                    <option key={index} value={index}>
                      {div.name}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-[#4A3728] font-medium mb-2">
              Round
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
              Pairing
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
