// src/components/tournaments/TournamentDetails.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/api";

const TournamentDetails = () => {
  const params = useParams(); // Will get either id or name depending on route
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);

  React.useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        // Determine which parameter we have and use appropriate endpoint
        const endpoint = params.id
          ? `${API_BASE}/api/tournaments/${params.id}`
          : `${API_BASE}/api/tournaments/by-name/${params.name}`;

        const tournamentResponse = await fetch(endpoint);
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          setTournament(tournamentData);
        }
      } catch (error) {
        console.error("Error fetching tournament details:", error);
      }
    };
    fetchTournamentData();
  }, [params.id, params.name]);

  if (!tournament) {
    return <div>Loading...</div>;
  }

  console.log(tournament);

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
          <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex">
              <span className="text-gray-600 font-medium w-32">City:</span>
              <span>{tournament.city || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 font-medium w-32">Year:</span>
              <span>{tournament.year || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 font-medium w-32">Lexicon:</span>
              <span>{tournament.lexicon || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 font-medium w-32">
                Long Form Name:
              </span>
              <span>{tournament.long_form_name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 font-medium w-32">Data URL:</span>
              <span>{tournament.data_url || "N/A"}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mt-6">Standings</h3>
          <div>
            {tournament.divisions.map((division, divIndex) => (
              <div key={division.name} className="mt-6">
                <h4 className="text-xl font-semibold mb-2">{division.name}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left border">Name</th>
                        <th className="px-4 py-2 text-center border">W</th>
                        <th className="px-4 py-2 text-center border">L</th>
                        <th className="px-4 py-2 text-center border">T</th>
                        <th className="px-4 py-2 text-right border">Spread</th>
                        <th className="px-4 py-2 text-right border">Average</th>
                        <th className="px-4 py-2 text-right border">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournament.standings[divIndex].map((player, index) => (
                        <tr
                          key={player.name}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-4 py-2 border">{player.name}</td>
                          <td className="px-4 py-2 text-center border">
                            {player.wins}
                          </td>
                          <td className="px-4 py-2 text-center border">
                            {player.losses}
                          </td>
                          <td className="px-4 py-2 text-center border">
                            {player.ties}
                          </td>
                          <td className="px-4 py-2 text-right border">
                            {player.spread}
                          </td>
                          <td className="px-4 py-2 text-right border">
                            {player.averageScore}
                          </td>
                          <td className="px-4 py-2 text-right border">
                            {player.highScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
