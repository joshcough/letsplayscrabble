import React from "react";
import { useParams, Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

type RouteParams = {
  userId: string;
  tournamentId: string;
  divisionName: string;
  playerId: string;
};

const PlayerOverlayTestingPage: React.FC = () => {
  const { userId, tournamentId, divisionName, playerId } =
    useParams<RouteParams>();
  const { userId: authUserId } = useAuth();

  const urlGroups = [
    {
      title: "Basic Player Info",
      sources: [
        { source: "name", description: "Player Name" },
        { source: "record", description: "Player Record (W-L-T)" },
        { source: "average-score", description: "Player Average Score" },
        { source: "high-score", description: "Player High Score" },
        { source: "spread", description: "Player Spread" },
      ],
    },
    {
      title: "Rankings",
      sources: [
        { source: "rank", description: "Player Rank (number)" },
        { source: "rank-ordinal", description: "Player Rank (1st, 2nd, etc.)" },
      ],
    },
    {
      title: "Ratings",
      sources: [{ source: "rating", description: "Player Rating" }],
    },
    {
      title: "Under Camera Displays",
      sources: [
        { source: "under-cam", description: "Under Cam (full with seed)" },
        { source: "under-cam-no-seed", description: "Under Cam (no seed)" },
        { source: "under-cam-small", description: "Under Cam (small)" },
        {
          source: "under-cam-with-rating",
          description: "Under Cam (with rating)",
        },
      ],
    },
    {
      title: "Game Data",
      sources: [
        { source: "points", description: "Player Points Display" },
        { source: "game-history", description: "Points + Game History" },
        { source: "game-history-small", description: "Game History Small" },
      ],
    },
    {
      title: "Best of 7 & Tournament",
      sources: [
        { source: "bo7", description: "Best of 7 Record" },
        {
          source: "tournament-info",
          description: "Tournament Name, Lexicon, Division",
        },
      ],
    },
  ];

  const baseUrl = window.location.origin;

  // Validation
  if (!userId || !tournamentId || !divisionName || !playerId) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-red-600">
          Missing Parameters
        </h1>
        <p className="text-center text-gray-600">
          This page requires userId, tournamentId, divisionName, and playerId in
          the URL.
        </p>
      </div>
    );
  }

  // Check if user matches (optional security check)
  if (authUserId && authUserId.toString() !== userId) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-red-600">
          Access Denied
        </h1>
        <p className="text-center text-gray-600">
          You can only test overlays for your own tournaments.
        </p>
      </div>
    );
  }

  // Component to render PlayerOverlay with a specific source parameter
  const PlayerOverlayRenderer: React.FC<{ source: string }> = ({ source }) => {
    return (
      <div className="p-3 bg-gray-50 border rounded min-h-[60px] flex items-center">
        <iframe
          src={`/users/${userId}/overlay/player/${tournamentId}/${encodeURIComponent(divisionName)}?source=${source}&playerId=${playerId}`}
          className="w-full h-16 border-0"
          title={`Player overlay: ${source}`}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Player Overlay Testing
        </h1>
        <div className="text-center text-gray-600 space-y-1">
          <p>
            <strong>Tournament:</strong> {tournamentId}
          </p>
          <p>
            <strong>Division:</strong> {decodeURIComponent(divisionName)}
          </p>
          <p>
            <strong>Player ID:</strong> {playerId}
          </p>
          <p>
            <strong>User ID:</strong> {userId}
          </p>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <Link
          to={`/tournaments/${tournamentId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ← Back to Tournament Details
        </Link>
      </div>

      {urlGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
            {group.title}
          </h2>

          <div className="space-y-4">
            {group.sources.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="p-4 bg-white rounded-lg shadow border"
              >
                <h4 className="font-semibold text-gray-700 mb-2">
                  {item.description}
                </h4>
                <Link
                  to={`/users/${userId}/overlay/player/${tournamentId}/${encodeURIComponent(divisionName)}?source=${item.source}&playerId=${playerId}`}
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all block mb-3"
                >
                  {baseUrl}/users/{userId}/overlay/player/{tournamentId}/
                  {encodeURIComponent(divisionName)}?source={item.source}
                  &playerId={playerId}
                </Link>

                {/* Rendered content */}
                <div className="mt-3">
                  <PlayerOverlayRenderer source={item.source} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Testing Notes:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• All links open in new tabs for easy testing</li>
          <li>• Rendered content shows below each URL</li>
          <li>
            • This is the new clean PlayerOverlay (no player1/player2 mess)
          </li>
          <li>
            • URLs are specific to Tournament {tournamentId}, Division{" "}
            {decodeURIComponent(divisionName)}, Player {playerId}
          </li>
          <li>• All URLs are scoped to user account {userId}</li>
          <li>
            • Total:{" "}
            {urlGroups.reduce(
              (total, group) => total + group.sources.length,
              0,
            )}{" "}
            source-based URLs for this player
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PlayerOverlayTestingPage;
