import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchWithAuth } from "../../config/api";
import { fetchTournamentRow } from "../../utils/api";
import { TournamentRow } from "@shared/types/database";
import { ProtectedPage } from "../ProtectedPage";
import { useAuth } from "../../context/AuthContext";

type RouteParams = {
  id: string;
  name: string;
};

interface PollingResponse {
  pollUntil: string;
}

const TournamentDetails: React.FC = () => {
  const { userId } = useAuth();
  const params = useParams<RouteParams>();
  const navigate = useNavigate();

  // Type assertions - safe because ProtectedPage guarantees auth
  const user_id = userId!;
  const tournamentId = parseInt(params.id!);

  const [tournament, setTournament] = useState<TournamentRow | null>(null);
  const [pollingDays, setPollingDays] = useState<number>(1);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollUntil, setPollUntil] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTournament, setEditedTournament] =
    useState<TournamentRow | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (tournament) {
      setEditedTournament(tournament);
    }
  }, [tournament]);

  const handleEnablePolling = async () => {
    try {
      const data: PollingResponse = await fetchWithAuth(
        `/api/private/tournaments/${params.id}/polling`,
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
      await fetchWithAuth(`/api/private/tournaments/${params.id}/polling`, {
        method: "DELETE",
      });

      setIsPolling(false);
      setPollUntil(null);
    } catch (error) {
      console.error("Error disabling polling:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetchWithAuth(`/api/private/tournaments/${params.id}`, {
        method: "DELETE",
      });

      navigate("/tournaments/manager");
    } catch (error) {
      console.error("Error deleting tournament:", error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (!editedTournament) return;

      const editableFields = {
        name: editedTournament.name || "",
        city: editedTournament.city || "",
        year: editedTournament.year || 0,
        lexicon: editedTournament.lexicon || "",
        longFormName: editedTournament.long_form_name || "",
        dataUrl: editedTournament.data_url || "",
      };

      await fetchWithAuth(`/api/private/tournaments/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableFields),
      });

      const freshTournamentData = await fetchTournamentRow(
        user_id,
        tournamentId,
      );
      setTournament(freshTournamentData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving tournament changes:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editedTournament) {
      setEditedTournament({
        ...editedTournament,
        [field]: value,
      });
    }
  };

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const tournamentData: TournamentRow = await fetchTournamentRow(
          user_id,
          tournamentId,
        );
        setTournament(tournamentData);

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
  }, [user_id, tournamentId]);

  if (!tournament || !editedTournament) {
    return (
      <ProtectedPage>
        <div>Loading...</div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {isEditing ? (
              <input
                type="text"
                value={editedTournament.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="px-2 py-1 border rounded w-full"
              />
            ) : (
              tournament.name
            )}
          </h2>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTournament(tournament);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => navigate("/tournaments/manager")}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Back to List
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Tournament Details</h3>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex">
                <span className="text-gray-600 font-medium w-32">City:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTournament.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{tournament.city || "N/A"}</span>
                )}
              </div>
              <div className="flex">
                <span className="text-gray-600 font-medium w-32">Year:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTournament.year || ""}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{tournament.year || "N/A"}</span>
                )}
              </div>
              <div className="flex">
                <span className="text-gray-600 font-medium w-32">Lexicon:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTournament.lexicon || ""}
                    onChange={(e) =>
                      handleInputChange("lexicon", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{tournament.lexicon || "N/A"}</span>
                )}
              </div>
              <div className="flex">
                <span className="text-gray-600 font-medium w-32">
                  Display Name:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTournament.long_form_name || ""}
                    onChange={(e) =>
                      handleInputChange("long_form_name", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{tournament.long_form_name || "N/A"}</span>
                )}
              </div>
              <div className="flex">
                <span className="text-gray-600 font-medium w-32">
                  Data URL:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTournament.data_url || ""}
                    onChange={(e) =>
                      handleInputChange("data_url", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{tournament.data_url || "N/A"}</span>
                )}
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
                        onChange={(e) =>
                          setPollingDays(parseInt(e.target.value))
                        }
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

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Overlay Links</h4>
            <Link
              to={`/overlay/${user_id}/tournaments/${tournamentId}`}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
            >
              View Tournament Overlays →
            </Link>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
};

export default TournamentDetails;
