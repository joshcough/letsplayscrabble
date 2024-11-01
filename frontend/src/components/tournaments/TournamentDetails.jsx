// src/components/tournaments/TournamentDetails.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/api";

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [rounds, setRounds] = useState([]);

  React.useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const tournamentResponse = await fetch(
          `${API_BASE}/api/tournaments/${id}`,
        );
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          setTournament(tournamentData);
        }

        const roundsResponse = await fetch(
          `${API_BASE}/api/tournaments/${id}/rounds`,
        );
        if (roundsResponse.ok) {
          const roundsData = await roundsResponse.json();
          setRounds(roundsData);
        }
      } catch (error) {
        console.error("Error fetching tournament details:", error);
      }
    };
    fetchTournamentData();
  }, [id]);

  if (!tournament) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{tournament.name}</h2>
        <button
          onClick={() => navigate("/tournaments")}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Tournament Details</h3>
          <p>City: {tournament.city}</p>
          <p>Year: {tournament.year}</p>
          <p>Lexicon: {tournament.lexicon}</p>
          <p>Long Form Name: {tournament.longFormName}</p>
          <p>Data URL: {tournament.dataUrl}</p>
        </div>

        <div>
          <h3 className="font-semibold mt-6">Rounds</h3>
          {rounds.map((round) => (
            <div key={round.id} className="mt-2 p-4 border rounded">
              <p>Round {round.roundId}</p>
              <p>Table {round.tableId}</p>
              <pre className="mt-2 p-2 bg-gray-50 rounded">
                {JSON.stringify(round.roundData, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
