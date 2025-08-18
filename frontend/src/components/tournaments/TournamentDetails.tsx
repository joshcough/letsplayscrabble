import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import * as Domain from "@shared/types/domain";

import { useAuth } from "../../context/AuthContext";
import { ApiService } from "../../services/interfaces";
import { ProtectedPage } from "../ProtectedPage";

type RouteParams = {
  id: string;
  name: string;
};

const TournamentDetails: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { userId } = useAuth();
  const params = useParams<RouteParams>();
  const navigate = useNavigate();

  // Type assertions - safe because ProtectedPage guarantees auth
  const user_id = userId!;
  const tournamentId = parseInt(params.id!);

  const [tournament, setTournament] = useState<Domain.TournamentSummary | null>(
    null,
  );
  const [divisions, setDivisions] = useState<Domain.Division[]>([]);
  const [divisionPlayers, setDivisionPlayers] = useState<
    Record<string, Domain.Player[]>
  >({});
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(),
  );
  const [loadingPlayers, setLoadingPlayers] = useState<Set<string>>(new Set());
  const [pollingDays, setPollingDays] = useState<number>(1);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollUntil, setPollUntil] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTournament, setEditedTournament] =
    useState<Domain.TournamentSummary | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (tournament) {
      setEditedTournament(tournament);
    }
  }, [tournament]);

  const toggleDivisionExpansion = async (divisionName: string) => {
    const newExpanded = new Set(expandedDivisions);

    if (expandedDivisions.has(divisionName)) {
      // Collapse
      newExpanded.delete(divisionName);
    } else {
      // Expand - fetch players if not already loaded
      newExpanded.add(divisionName);

      if (!divisionPlayers[divisionName]) {
        setLoadingPlayers((prev) => new Set(prev).add(divisionName));
        const response = await apiService.getPlayersForDivision(
          user_id,
          tournamentId,
          divisionName,
        );
        if (response.success) {
          setDivisionPlayers((prev) => ({
            ...prev,
            [divisionName]: response.data,
          }));
        } else {
          console.error(
            `Error fetching players for division ${divisionName}:`,
            response.error,
          );
        }
        // Always update loading state
        setLoadingPlayers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(divisionName);
          return newSet;
        });
      }
    }

    setExpandedDivisions(newExpanded);
  };

  const overlayTypes = [
    {
      title: "Rating Gain Leaders",
      path: "rating_gain",
      description: "Players ranked by rating change",
    },
    {
      title: "Rating Gain with Pictures",
      path: "rating_gain_with_pics",
      description: "Rating gain leaders with player photos",
    },
    {
      title: "High Scores with Pictures",
      path: "high_scores_with_pics",
      description: "High score leaders with player photos",
    },
    {
      title: "Standings",
      path: "standings",
      description: "Division standings in table",
    },
    {
      title: "Standings with Pictures",
      path: "standings_with_pics",
      description: "Division standings with pictures",
    },
    {
      title: "Scoring Leaders",
      path: "scoring_leaders",
      description: "Players ranked by average score",
    },
    {
      title: "Scoring Leaders with Pictures",
      path: "scoring_leaders_with_pics",
      description: "Scoring leaders with player photos",
    },
    {
      title: "Division Stats",
      path: "tournament_stats",
      description: "Division statistics and analytics",
    },
  ];

  const handleEnablePolling = async () => {
    const response = await apiService.enablePolling(Number(params.id), {
      pollUntilMinutes: pollingDays * 24 * 60,
    });

    if (response.success) {
      setIsPolling(true);
      setPollUntil(new Date(response.data.pollUntil));
    } else {
      console.error("Error enabling polling:", response.error);
    }
  };

  const handleDisablePolling = async () => {
    const response = await apiService.disablePolling(Number(params.id));
    if (response.success) {
      setIsPolling(false);
      setPollUntil(null);
    } else {
      console.error("Error disabling polling:", response.error);
    }
  };

  const handleDelete = async () => {
    const response = await apiService.deleteTournament(Number(params.id));
    if (response.success) {
      navigate("/tournaments/manager");
    } else {
      console.error("Error deleting tournament:", response.error);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedTournament) return;

    const editableFields = {
      name: editedTournament.name || "",
      city: editedTournament.city || "",
      year: editedTournament.year || 0,
      lexicon: editedTournament.lexicon || "",
      longFormName: editedTournament.longFormName || "",
      dataUrl: editedTournament.dataUrl || "",
    };

    const updateResponse = await apiService.updateTournament(
      Number(params.id),
      editableFields,
    );

    if (updateResponse.success) {
      const freshDataResponse = await apiService.getTournamentSummary(
        user_id,
        tournamentId,
      );
      if (freshDataResponse.success) {
        setTournament(freshDataResponse.data);
        setIsEditing(false);
      } else {
        console.error(
          "Error refreshing tournament data:",
          freshDataResponse.error,
        );
      }
    } else {
      console.error("Error saving tournament changes:", updateResponse.error);
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
      const response = await apiService.getTournamentSummary(
        user_id,
        tournamentId,
      );

      if (response.success) {
        setTournament(response.data);

        if (response.data.pollUntil) {
          const pollUntilDate = response.data.pollUntil;
          setIsPolling(pollUntilDate > new Date());
          setPollUntil(pollUntilDate);
        } else {
          setIsPolling(false);
          setPollUntil(null);
        }
      } else {
        console.error("Error fetching tournament details:", response.error);
      }
    };

    const fetchDivisionsData = async () => {
      const response = await apiService.getDivisions(user_id, tournamentId);
      if (response.success) {
        setDivisions(response.data);
      } else {
        console.error("Error fetching divisions:", response.error);
      }
    };

    fetchTournamentData();
    fetchDivisionsData();
  }, [user_id, tournamentId, apiService]);

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
                    value={editedTournament.longFormName || ""}
                    onChange={(e) =>
                      handleInputChange("longFormName", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{tournament.longFormName || "N/A"}</span>
                )}
              </div>
              <div className="flex">
                <span className="text-gray-600 font-medium w-32">
                  Data URL:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTournament.dataUrl || ""}
                    onChange={(e) =>
                      handleInputChange("dataUrl", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{tournament.dataUrl || "N/A"}</span>
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

          {/* Overlay Links Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-4">
              Tournament Overlay Links
            </h4>

            {/* Tournament-wide overlay */}
            <div className="bg-white p-4 rounded border mb-4">
              <h5 className="font-semibold text-gray-800 mb-3">
                Tournament-wide
              </h5>
              <Link
                to={`/users/${user_id}/overlay/tournament_stats/${tournamentId}`}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
                target="_blank"
                title="Tournament statistics and analytics"
              >
                Tournament Stats →
              </Link>
            </div>

            {divisions.length === 0 ? (
              <p className="text-blue-600">
                No divisions found for this tournament.
              </p>
            ) : (
              <div className="space-y-6">
                {divisions.map((division) => (
                  <div
                    key={division.id}
                    className="bg-white p-4 rounded border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-800">
                        Division {division.name}
                      </h5>
                      <button
                        onClick={() => toggleDivisionExpansion(division.name)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {expandedDivisions.has(division.name)
                          ? "Hide Players"
                          : "Show Players"}
                      </button>
                    </div>

                    {/* Players List */}
                    {expandedDivisions.has(division.name) && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        {loadingPlayers.has(division.name) ? (
                          <div className="text-gray-600">
                            Loading players...
                          </div>
                        ) : divisionPlayers[division.name] ? (
                          <div className="space-y-1">
                            <h6 className="font-medium text-gray-700 mb-2">
                              Players:
                            </h6>
                            {divisionPlayers[division.name].map((player) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span>
                                  <strong>#{player.seed}</strong> {player.name}
                                </span>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-500">
                                    ID: {player.id} | Rating:{" "}
                                    {player.initialRating}
                                  </span>
                                  <Link
                                    to={`/users/${user_id}/overlay/player/${tournamentId}/${encodeURIComponent(division.name)}/${player.id}/test`}
                                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    target="_blank"
                                  >
                                    Test Overlays →
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-600">No players found</div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {overlayTypes.map((overlay) => (
                        <Link
                          key={overlay.path}
                          to={`/users/${user_id}/overlay/${overlay.path}/${tournamentId}/${division.name}`}
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                          target="_blank"
                          title={overlay.description}
                        >
                          {overlay.title} →
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-100 rounded text-sm text-blue-700">
              <strong>Note:</strong> Remember to add the Worker Page as a
              Browser Source in OBS for real-time updates.
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
};

export default TournamentDetails;
