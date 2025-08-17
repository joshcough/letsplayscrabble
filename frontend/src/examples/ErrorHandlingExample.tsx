// frontend/src/examples/ErrorHandlingExample.tsx
// Example component demonstrating the new error handling pattern

import React, { useState } from "react";
import { ApiService } from "../services/interfaces";
import * as Domain from "@shared/types/domain";

export const ErrorHandlingExample: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState<Domain.TournamentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLoadTournaments = async () => {
    setLoading(true);
    setError(null);

    // The new pattern: service returns ApiResponse<T>
    const response = await apiService.listTournaments();

    if (response.success) {
      setTournaments(response.data);
    } else {
      // Handle different types of errors appropriately
      if (response.error.includes("401") || response.error.includes("authentication")) {
        // Handle authentication errors - redirect to login
        setError("Please log in to view tournaments");
      } else if (response.error.includes("500")) {
        // Handle server errors - show user-friendly message
        setError("Server error. Please try again later.");
      } else if (response.error.includes("Network")) {
        // Handle network errors
        setError("Network error. Please check your connection.");
      } else {
        // Handle other errors
        setError(`Failed to load tournaments: ${response.error}`);
      }
    }

    setLoading(false);
  };

  const handleLoadCurrentMatch = async (userId: number) => {
    const response = await apiService.getCurrentMatch(userId);
    
    if (response.success) {
      if (response.data) {
        console.log("Current match:", response.data);
      } else {
        console.log("No current match found");
      }
    } else {
      console.error("Failed to get current match:", response.error);
    }
  };

  return (
    <div>
      <h2>Error Handling Example</h2>
      
      <button onClick={handleLoadTournaments} disabled={loading}>
        {loading ? "Loading..." : "Load Tournaments"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>
          Error: {error}
        </div>
      )}

      {tournaments.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <h3>Tournaments:</h3>
          <ul>
            {tournaments.map((tournament) => (
              <li key={tournament.id}>
                {tournament.name} ({tournament.year})
                <button 
                  onClick={() => handleLoadCurrentMatch(1)} 
                  style={{ marginLeft: 10 }}
                >
                  Get Current Match
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, color: "#666" }}>
        <h4>Benefits of this pattern:</h4>
        <ul>
          <li>✅ No exceptions thrown - explicit error handling</li>
          <li>✅ Preserve error context and types</li>
          <li>✅ Components can handle different error types appropriately</li>
          <li>✅ Easy to test - mock services can return specific error states</li>
          <li>✅ Type safe - TypeScript knows about success/failure branches</li>
        </ul>
      </div>
    </div>
  );
};