import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchWithAuth } from "../../config/api";
import TournamentStandings from "./TournamentStandings";
import { ProcessedTournament } from "@shared/types/tournament";

interface RouteParams {
  id?: string;
  name?: string;
}

interface PollingResponse {
  pollUntil: string;
}

const TournamentDetails: React.FC = () => {
  const params = useParams<RouteParams>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<ProcessedTournament | null>(
    null,
  );
  const [pollingDays, setPollingDays] = useState<number>(1);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollUntil, setPollUntil] = useState<Date | null>(null);

  const handleEnablePolling = async () => {
    try {
      const data: PollingResponse = await fetchWithAuth(
        `/api/tournaments/${params.id}/polling`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ days: pollingDays }),
        },
      );

      setIsPolling(true);
      setPollUntil(new Date(data.pollUntil));
    } catch (error) {
      console.error("Error enabling polling:", error);
    }
  };

  const handleDisablePolling = async () => {
    try {
      await fetchWithAuth(`/api/tournaments/${params.id}/polling`, {
        method: "DELETE",
      });

      setIsPolling(false);
      setPollUntil(null);
    } catch (error) {
      console.error("Error disabling polling:", error);
    }
  };

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const endpoint = params.id
          ? `/api/tournaments/${params.id}`
          : `/api/tournaments/by-name/${params.name}`;

        const tournamentData: ProcessedTournament =
          await fetchWithAuth(endpoint);
        setTournament(tournamentData);

        // Set polling status if poll_until exists
        if (tournamentData.poll_until) {
          const pollUntilDate = new Date(tournamentData.poll_until);
          setIsPolling(pollUntilDate > new Date());
          setPollUntil(pollUntilDate);
        } else {
          setIsPolling(false);
          setPollUntil(null);
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
            {tournament.divisions.map((division) => (
              <div key={division.name} className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-semibold">{division.name}</h4>
                  <Link
                    to={`/tournaments/${params.id}/standings/${encodeURIComponent(
                      division.name,
                    )}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Full Standings →
                  </Link>
                </div>
                <TournamentStandings
                  tournamentId={params.id}
                  divisionName={division.name}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
