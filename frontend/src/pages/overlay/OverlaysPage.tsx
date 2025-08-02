import React from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const OverlaysPage: React.FC = () => {
  const { userId } = useAuth();

  // If user is not authenticated, show error
  if (!userId) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-red-600">
          Authentication Required
        </h1>
        <p className="text-center text-gray-600">
          Please log in to access overlay URLs.
        </p>
      </div>
    );
  }

  const overlays = [
    {
      title: "Worker Page",
      path: "/worker",
      description:
        "Background service that manages real-time data updates for all overlays",
      isSpecial: true,
    },
    {
      title: "Misc Overlay Testing",
      path: "/overlay/misc_testing",
      description:
        "Test page showing all available misc overlay sources and examples",
    },
    {
      title: "Rating Gain Leaders",
      path: `/users/${userId}/overlay/rating_gain`,
      description: "Players ranked by rating change",
    },
    {
      title: "Rating Gain with Pictures",
      path: `/users/${userId}/overlay/rating_gain_with_pics`,
      description: "Rating gain leaders with player photos",
    },
    {
      title: "High Scores with Pictures",
      path: `/users/${userId}/overlay/high_scores_with_pics`,
      description: "High score leaders with player photos",
    },
    {
      title: "Standings",
      path: `/users/${userId}/overlay/standings`,
      description: "Division standings in table",
    },
    {
      title: "Standings with Pictures",
      path: `/users/${userId}/overlay/standings_with_pics`,
      description: "Division standings with pictures",
    },
    {
      title: "Scoring Leaders",
      path: `/users/${userId}/overlay/scoring_leaders`,
      description: "Players ranked by average score",
    },
    {
      title: "Scoring Leaders with Pictures",
      path: `/users/${userId}/overlay/scoring_leaders_with_pics`,
      description: "Scoring leaders with player photos",
    },
    {
      title: "Tournament Stats",
      path: `/users/${userId}/overlay/tournament_stats`,
      description: "Tournament statistics and analytics",
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#4A3728]">
        Tournament Overlays & Worker
      </h1>

      <p className="text-lg mb-6 text-center text-[#6B5744]">
        These overlays work with both current match data and URL parameters
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {overlays.map((overlay) => (
          <Link
            key={overlay.path}
            to={overlay.path}
            className={`block p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border ${
              overlay.isSpecial
                ? "bg-orange-50 border-orange-200 hover:border-orange-300 hover:bg-orange-100"
                : "bg-[#FAF1DB] border-[#4A3728]/20 hover:border-[#4A3728]/40 hover:bg-[#4A3728]/5"
            }`}
          >
            <h3
              className={`text-xl font-semibold mb-2 ${
                overlay.isSpecial ? "text-orange-800" : "text-[#4A3728]"
              }`}
            >
              {overlay.title}
              {overlay.isSpecial && (
                <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                  Required
                </span>
              )}
            </h3>
            <p
              className={`text-sm ${
                overlay.isSpecial ? "text-orange-700" : "text-[#6B5744]"
              }`}
            >
              {overlay.description}
            </p>
            <div
              className={`mt-4 text-sm ${
                overlay.isSpecial
                  ? "text-orange-800 hover:text-orange-600"
                  : "text-[#4A3728] hover:text-[#4A3728]/80"
              }`}
            >
              {overlay.isSpecial
                ? "Add as Browser Source →"
                : "Add as Browser Source →"}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h3 className="font-semibold text-orange-800 mb-2">
          ⚠️ Important - Worker Browser Source Required:
        </h3>
        <ul className="text-orange-700 text-sm space-y-1">
          <li>
            • <strong>Must add the Worker Page as a Browser Source</strong> in
            OBS for real-time updates to work
          </li>
          <li>
            • <strong>The worker handles:</strong> WebSocket connections,
            tournament polling, and data broadcasting
          </li>
          <li>
            • <strong>All overlay Browser Sources depend on the worker</strong>{" "}
            - without it, data won't update automatically
          </li>
          <li>
            • <strong>One worker per user</strong> - only add one worker Browser
            Source to avoid conflicts
          </li>
          <li>
            • <strong>Keep worker Browser Source enabled</strong> even if not
            visible in your scene
          </li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-[#FFF8E7] border border-[#4A3728]/20 rounded-lg">
        <h3 className="font-semibold text-[#4A3728] mb-2">How it works:</h3>
        <ul className="text-[#6B5744] text-sm space-y-1">
          <li>
            • <strong>Default:</strong> Uses currently selected match in admin
            interface
          </li>
          <li>
            • <strong>With URL params:</strong> Most overlays support
            /tournamentId/divisionName for specific tournament data
          </li>
          <li>
            • <strong>Example:</strong> /users/{userId}/overlay/standings/123/A
            shows standings for tournament 123, division A
          </li>
          <li>
            • <strong>Misc overlay:</strong> Add ?source=player1-name (or other
            sources) for specific data elements
          </li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">For OBS Setup:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>
            • <strong>Step 1:</strong> Add Worker Page as a Browser Source (can
            be in any scene, even if not visible)
          </li>
          <li>
            • <strong>Step 2:</strong> Add your overlay Browser Sources using
            the URLs below
          </li>
          <li>
            •{" "}
            <strong>All Browser Sources are scoped to your user account</strong>{" "}
            (ID: {userId})
          </li>
          <li>
            • <strong>Worker must stay enabled</strong> for live data updates
            across all overlays
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OverlaysPage;
