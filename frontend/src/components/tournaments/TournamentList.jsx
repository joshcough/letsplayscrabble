// src/components/tournaments/TournamentList.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/api";

const TournamentList = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);

  React.useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tournaments`);
        if (response.ok) {
          const data = await response.json();
          setTournaments(data);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };
    fetchTournaments();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Tournaments</h2>
        <button
          onClick={() => navigate("/tournaments/add")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Tournament
        </button>
      </div>
      <div className="space-y-4">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
          >
            <h3 className="font-semibold">{tournament.name}</h3>
            <p className="text-sm text-gray-600">
              {tournament.city}, {tournament.year} - {tournament.lexicon}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
