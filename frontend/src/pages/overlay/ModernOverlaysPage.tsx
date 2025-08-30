import React from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { ApiService } from "../../services/interfaces";

const ModernOverlaysPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
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

  const modernOverlays = [
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
      title: "Rating Gain Leaders (Modern)",
      path: `/users/${userId}/overlay/rating_gain_modern`,
      description: "Players ranked by rating change - modern dark theme",
    },
    {
      title: "Rating Gain with Pictures (Modern)",
      path: `/users/${userId}/overlay/rating_gain_with_pics_modern`,
      description: "Rating gain leaders with player photos - modern dark theme",
    },
    {
      title: "High Scores with Pictures (Modern)",
      path: `/users/${userId}/overlay/high_scores_with_pics_modern`,
      description: "High score leaders with player photos - modern dark theme",
    },
    {
      title: "Standings (Modern)",
      path: `/users/${userId}/overlay/standings_modern`,
      description: "Division standings in table - modern dark theme",
    },
    {
      title: "Standings with Pictures (Modern)",
      path: `/users/${userId}/overlay/standings_with_pics_modern`,
      description: "Division standings with pictures - modern dark theme",
    },
    {
      title: "Scoring Leaders (Modern)",
      path: `/users/${userId}/overlay/scoring_leaders_modern`,
      description: "Players ranked by average score - modern dark theme",
    },
    {
      title: "Scoring Leaders with Pictures (Modern)",
      path: `/users/${userId}/overlay/scoring_leaders_with_pics_modern`,
      description: "Scoring leaders with player photos - modern dark theme",
    },
    {
      title: "Tournament Stats (Modern)",
      path: `/users/${userId}/overlay/tournament_stats_modern`,
      description: "Tournament statistics and analytics - modern dark theme",
    },
    {
      title: "Cross-Tables Player Profile (Modern)",
      path: `/users/${userId}/overlay/cross_tables_profile_modern?player=1`,
      description: "Player profiles with cross-tables ratings, rankings, and career stats - modern dark theme. Use ?player=1/2 for current match or /tournamentId/divisionName/playerId for specific player",
      requiresParams: true,
    },
    {
      title: "Head-to-Head Comparison (Modern)",
      path: `/users/${userId}/overlay/head_to_head_modern`,
      description: "Compare two players with head-to-head record, average scores, and tournament standings - modern dark theme. Uses current match players or /tournamentId/divisionName/playerId1/playerId2 for specific players",
      requiresParams: true,
    },
    {
      title: "Player Data Display (Modern)",
      path: `/users/${userId}/overlay/player_modern?player=1&source=name`,
      description: "Display specific player data (name, record, scores, etc.) - modern dark theme. Add ?player=1/2 and &source=name/record/rank etc.",
      requiresParams: true,
    },
    {
      title: "Misc Data Display (Modern)",
      path: `/users/${userId}/overlay/misc_modern?source=player1-name`,
      description: "Display specific data elements (player names, records, tournament info) - modern dark theme. Add ?source=player1-name, player2-record, etc.",
      requiresParams: true,
    },
    {
      title: "Ping Test (Modern)",
      path: `/users/${userId}/overlay/ping_modern`,
      description: "WebSocket connectivity test - modern dark theme",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          Modern Tournament Overlays & Worker
        </h1>

        <p className="text-xl mb-8 text-center text-gray-300">
          Dark theme overlays with modern glass-morphism design
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modernOverlays.map((overlay) => (
            <Link
              key={overlay.path}
              to={overlay.path}
              className={`block p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border backdrop-blur-xl ${
                overlay.isSpecial
                  ? "bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-400/50 hover:border-orange-300/70 hover:from-orange-900/60 hover:to-red-900/60"
                  : "bg-gradient-to-br from-blue-900/50 to-gray-900/60 border-blue-400/50 hover:border-blue-300/70 hover:from-blue-900/60 hover:to-gray-900/70"
              }`}
            >
              <h3
                className={`text-xl font-semibold mb-3 ${
                  overlay.isSpecial ? "text-orange-300" : "text-blue-300"
                }`}
              >
                {overlay.title}
                {overlay.isSpecial && (
                  <span className="ml-2 text-xs bg-orange-500/30 text-orange-200 px-2 py-1 rounded-full border border-orange-400/30">
                    Required
                  </span>
                )}
                {overlay.requiresParams && (
                  <span className="ml-2 text-xs bg-blue-500/30 text-blue-200 px-2 py-1 rounded-full border border-blue-400/30">
                    Params
                  </span>
                )}
              </h3>
              <p
                className={`text-sm mb-4 ${
                  overlay.isSpecial ? "text-orange-200" : "text-gray-300"
                }`}
              >
                {overlay.description}
              </p>
              <div
                className={`text-sm font-medium ${
                  overlay.isSpecial
                    ? "text-orange-200 hover:text-orange-100"
                    : "text-blue-200 hover:text-blue-100"
                } transition-colors`}
              >
                {overlay.isSpecial
                  ? "Add as Browser Source →"
                  : "Add as Browser Source →"}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-400/30 rounded-2xl backdrop-blur-xl">
          <h3 className="font-semibold text-orange-300 mb-3 text-lg">
            ⚠️ Important - Worker Browser Source Required:
          </h3>
          <ul className="text-orange-200 text-sm space-y-2">
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

        <div className="mt-6 p-6 bg-gradient-to-br from-blue-900/30 to-gray-900/30 border border-blue-400/30 rounded-2xl backdrop-blur-xl">
          <h3 className="font-semibold text-blue-300 mb-3 text-lg">Modern Theme Features:</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>
              • <strong>Dark gradient backgrounds</strong> with glass-morphism effects
            </li>
            <li>
              • <strong>Modern UI elements</strong> with backdrop blur and semi-transparent cards
            </li>
            <li>
              • <strong>Enhanced visual hierarchy</strong> with gradient text and improved color coding
            </li>
            <li>
              • <strong>Rank badges and icons</strong> for top performers and statistics
            </li>
            <li>
              • <strong>Responsive design</strong> optimized for streaming overlays
            </li>
          </ul>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-400/30 rounded-2xl backdrop-blur-xl">
          <h3 className="font-semibold text-purple-300 mb-3 text-lg">How it works:</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>
              • <strong>Default:</strong> Uses currently selected match in admin
              interface
            </li>
            <li>
              • <strong>With URL params:</strong> Most overlays support
              /tournamentId/divisionName for specific tournament data
            </li>
            <li>
              • <strong>Example:</strong> /users/{userId}/overlay/standings_modern/123/A
              shows standings for tournament 123, division A
            </li>
            <li>
              • <strong>Misc overlay:</strong> Add ?source=player1-name (or other
              sources) for specific data elements
            </li>
            <li>
              • <strong>Cross-Tables Profile:</strong> Two modes - Current match: ?player=1 or ?player=2. Specific player: /tournamentId/divisionName/playerId
            </li>
            <li>
              • <strong>Head-to-Head Comparison:</strong> Two modes - Current match players (no params needed). Specific players: /tournamentId/divisionName/playerId1/playerId2
            </li>
          </ul>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-br from-green-900/30 to-teal-900/30 border border-green-400/30 rounded-2xl backdrop-blur-xl">
          <h3 className="font-semibold text-green-300 mb-3 text-lg">For OBS Setup:</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>
              • <strong>Step 1:</strong> Add Worker Page as a Browser Source (can
              be in any scene, even if not visible)
            </li>
            <li>
              • <strong>Step 2:</strong> Add your modern overlay Browser Sources using
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
            <li>
              • <strong>Modern overlays work best</strong> with transparent backgrounds
              in OBS for the glass effects
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModernOverlaysPage;