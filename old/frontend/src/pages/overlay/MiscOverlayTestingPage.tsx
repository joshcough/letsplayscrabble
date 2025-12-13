import React from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { ApiService } from "../../services/interfaces";

const MiscOverlayTestingPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const { userId } = useAuth();

  const urlGroups = [
    {
      title: "Basic Player Info",
      urls: [
        { source: "player1-name", description: "Player 1 Name" },
        { source: "player2-name", description: "Player 2 Name" },
        { source: "player1-record", description: "Player 1 Record (W-L-T)" },
        { source: "player2-record", description: "Player 2 Record (W-L-T)" },
        {
          source: "player1-average-score",
          description: "Player 1 Average Score",
        },
        {
          source: "player2-average-score",
          description: "Player 2 Average Score",
        },
        { source: "player1-high-score", description: "Player 1 High Score" },
        { source: "player2-high-score", description: "Player 2 High Score" },
        { source: "player1-spread", description: "Player 1 Spread" },
        { source: "player2-spread", description: "Player 2 Spread" },
      ],
    },
    {
      title: "Rankings",
      urls: [
        { source: "player1-rank", description: "Player 1 Rank (number)" },
        { source: "player2-rank", description: "Player 2 Rank (number)" },
        {
          source: "player1-rank-ordinal",
          description: "Player 1 Rank (1st, 2nd, etc.)",
        },
        {
          source: "player2-rank-ordinal",
          description: "Player 2 Rank (1st, 2nd, etc.)",
        },
      ],
    },
    {
      title: "Ratings",
      urls: [
        { source: "player1-rating", description: "Player 1 Rating" },
        { source: "player2-rating", description: "Player 2 Rating" },
      ],
    },
    {
      title: "Under Camera Displays",
      urls: [
        {
          source: "player1-under-cam",
          description: "Player 1 Under Cam (full with seed)",
        },
        {
          source: "player2-under-cam",
          description: "Player 2 Under Cam (full with seed)",
        },
        {
          source: "player1-under-cam-no-seed",
          description: "Player 1 Under Cam (no seed)",
        },
        {
          source: "player2-under-cam-no-seed",
          description: "Player 2 Under Cam (no seed)",
        },
        {
          source: "player1-under-cam-small",
          description: "Player 1 Under Cam (small)",
        },
        {
          source: "player2-under-cam-small",
          description: "Player 2 Under Cam (small)",
        },
        {
          source: "player1-under-cam-with-rating",
          description: "Player 1 Under Cam (with rating)",
        },
        {
          source: "player2-under-cam-with-rating",
          description: "Player 2 Under Cam (with rating)",
        },
      ],
    },
    {
      title: "Game Data",
      urls: [
        {
          source: "player1-points",
          description: "Player 1 Points + Game History",
        },
        {
          source: "player2-points",
          description: "Player 2 Points + Game History",
        },
        {
          source: "player1-game-history",
          description: "Player 1 Game History",
        },
        {
          source: "player2-game-history",
          description: "Player 2 Game History",
        },
        {
          source: "player1-game-history-small",
          description: "Player 1 Game History Small",
        },
        {
          source: "player2-game-history-small",
          description: "Player 2 Game History Small",
        },
      ],
    },
    {
      title: "Best of 7 & Tournament",
      urls: [
        { source: "player1-bo7", description: "Player 1 Best of 7 Record" },
        { source: "player2-bo7", description: "Player 2 Best of 7 Record" },
        {
          source: "tournament-data",
          description: "Tournament Name, Lexicon, Round",
        },
      ],
    },
  ];

  const baseUrl = window.location.origin;

  // If user is not authenticated, show error
  if (!userId) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-red-600">
          Authentication Required
        </h1>
        <p className="text-center text-gray-600">
          Please log in to test misc overlays.
        </p>
      </div>
    );
  }

  // Component to render MiscOverlay with a specific source parameter
  const MiscOverlayRenderer: React.FC<{ source: string }> = ({ source }) => {
    return (
      <div className="p-3 bg-gray-50 border rounded min-h-[60px] flex items-center">
        <iframe
          src={`/users/${userId}/overlay/misc?source=${source}`}
          className="w-full h-16 border-0"
          title={`Stats overlay: ${source}`}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Misc Overlay Testing Page (User ID: {userId})
      </h1>

      {urlGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
            {group.title}
          </h2>

          <div className="space-y-4">
            {group.urls.map((url, urlIndex) => (
              <div
                key={urlIndex}
                className="p-4 bg-white rounded-lg shadow border"
              >
                <h4 className="font-semibold text-gray-700 mb-2">
                  {url.description}
                </h4>
                <Link
                  to={`/users/${userId}/overlay/misc?source=${url.source}`}
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all block mb-3"
                >
                  {baseUrl}/users/{userId}/overlay/misc?source={url.source}
                </Link>

                {/* Rendered content */}
                <div className="mt-3">
                  <MiscOverlayRenderer source={url.source} />
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
            • Make sure to set a current match in the admin interface first
          </li>
          <li>
            • URLs will show "Loading..." or "No data" if no match is selected
          </li>
          <li>• All URLs are scoped to your user account (ID: {userId})</li>
          <li>
            • Total:{" "}
            {urlGroups.reduce((total, group) => total + group.urls.length, 0)}{" "}
            source-based URLs
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MiscOverlayTestingPage;