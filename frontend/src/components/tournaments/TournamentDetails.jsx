import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/api";

const TournamentDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });
  const [pollingDays, setPollingDays] = useState(1);
  const [isPolling, setIsPolling] = useState(false);
  const [pollUntil, setPollUntil] = useState(null);

  // Column definitions with sort configurations
  const columns = [
    { key: "rank", label: "Rank", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "wins", label: "W", sortable: true },
    { key: "losses", label: "L", sortable: true },
    { key: "ties", label: "T", sortable: true },
    { key: "spread", label: "Spread", sortable: true },
    { key: "averageScore", label: "Average", sortable: true },
    { key: "highScore", label: "High", sortable: true },
  ];

  // Calculate ranks based on wins, losses, and spread
  const calculateRanks = (players) => {
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.spread - a.spread;
    });

    return sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  };

  const sortData = (data, sortConfig) => {
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === b[sortConfig.key]) {
        // Default secondary sort by wins, then losses, then spread
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.spread - a.spread;
      }

      if (sortConfig.direction === "asc") {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      } else {
        return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
      }
    });
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const getSortDirection = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "↑" : "↓";
    }
    return "";
  };

  const handleEnablePolling = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/tournaments/${params.id}/polling`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ days: pollingDays }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setIsPolling(true);
        setPollUntil(new Date(data.pollUntil));
      }
    } catch (error) {
      console.error("Error enabling polling:", error);
    }
  };

  const handleDisablePolling = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/tournaments/${params.id}/polling`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setIsPolling(false);
        setPollUntil(null);
      }
    } catch (error) {
      console.error("Error disabling polling:", error);
    }
  };

  React.useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const endpoint = params.id
          ? `${API_BASE}/api/tournaments/${params.id}`
          : `${API_BASE}/api/tournaments/by-name/${params.name}`;

        const tournamentResponse = await fetch(endpoint);
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();

          // Add ranks to players in each division
          const standingsWithRanks = tournamentData.standings.map(
            (divisionStandings) => {
              return calculateRanks(divisionStandings);
            },
          );

          setTournament({
            ...tournamentData,
            standings: standingsWithRanks,
          });

          // Set polling status if poll_until exists
          if (tournamentData.poll_until) {
            const pollUntilDate = new Date(tournamentData.poll_until);
            setIsPolling(pollUntilDate > new Date());
            setPollUntil(pollUntilDate);
          } else {
            setIsPolling(false);
            setPollUntil(null);
          }
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
            <div className="flex">
              <span className="text-gray-600 font-medium w-32">
                Auto-Update:
              </span>
              <div className="flex items-center space-x-4">
                {isPolling ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-green-600">
                      Active until {pollUntil?.toLocaleDateString()}{" "}
                      {pollUntil?.toLocaleTimeString()}
                    </span>
                    <button
                      onClick={handleDisablePolling}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={pollingDays}
                      onChange={(e) => setPollingDays(parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border rounded"
                    />
                    <span className="text-gray-600">days</span>
                    <button
                      onClick={handleEnablePolling}
                      className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                    >
                      Start
                    </button>
                  </div>
                )}
              </div>
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
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            className={`px-4 py-2 border ${column.sortable ? "cursor-pointer hover:bg-gray-100" : ""}`}
                            onClick={() =>
                              column.sortable && handleSort(column.key)
                            }
                            style={{
                              minWidth:
                                column.key === "name"
                                  ? "200px" // name needs more space
                                  : ["wins", "losses", "ties"].includes(
                                        column.key,
                                      )
                                    ? "80px" // W/L/T columns
                                    : ["rank"].includes(column.key)
                                      ? "80px" // rank column
                                      : "100px", // other columns
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span>{column.label}</span>
                              {column.sortable && (
                                <span className="ml-1 w-4 inline-block">
                                  {getSortDirection(column.key)}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortData(tournament.standings[divIndex], sortConfig).map(
                        (player, index) => (
                          <tr
                            key={player.name}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-2 border">{player.rank}</td>
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
                        ),
                      )}
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
