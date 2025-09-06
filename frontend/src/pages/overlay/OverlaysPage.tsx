import React from "react";
import { Link } from "react-router-dom";

import { BaseModernOverlay } from "../../components/shared/BaseModernOverlay";
import { useAuth } from "../../context/AuthContext";
import { ApiService } from "../../services/interfaces";
import { Theme } from "../../types/theme";

const OverlaysPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const { userId } = useAuth();

  return (
    <BaseModernOverlay>
      {(theme, themeClasses) => {
        // If user is not authenticated, show error
        if (!userId) {
          return (
            <div className={`${theme.colors.pageBackground} min-h-screen`}>
              <div className="container mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8 text-center text-red-600">
                  Authentication Required
                </h1>
                <p className="text-center text-gray-600">
                  Please log in to access overlay URLs.
                </p>
              </div>
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
    {
      title: "Cross-Tables Player Profile",
      path: `/users/${userId}/overlay/cross_tables_profile?player=1`,
      description: "Player profiles with cross-tables ratings, rankings, and career stats. Use ?player=1/2 for current match or /tournamentId/divisionName/playerId for specific player",
      requiresParams: true,
    },
    {
      title: "Head-to-Head Comparison",
      path: `/users/${userId}/overlay/head_to_head`,
      description: "Compare two players with head-to-head record, average scores, and tournament standings. Uses current match players or /tournamentId/divisionName/playerId1/playerId2 for specific players",
      requiresParams: true,
    },
    {
      title: "Player Data Display",
      path: `/users/${userId}/overlay/player?player=1&source=name`,
      description: "Display specific player data (name, record, scores, etc.). Add ?player=1/2 and &source=name/record/rank etc.",
      requiresParams: true,
    },
    {
      title: "Misc Data Display",
      path: `/users/${userId}/overlay/misc?source=player1-name`,
      description: "Display specific data elements (player names, records, tournament info). Add ?source=player1-name, player2-record, etc.",
      requiresParams: true,
    },
    {
      title: "Ping Test",
      path: `/users/${userId}/overlay/ping`,
      description: "WebSocket connectivity test",
    },
  ];

        return (
          <div className={`${theme.colors.pageBackground} min-h-screen`}>
            <div className="container mx-auto p-8">
              <h1 className={`text-4xl font-bold mb-8 text-center ${theme.name === 'original' ? theme.colors.titleGradient : `text-transparent bg-clip-text bg-gradient-to-r ${theme.colors.titleGradient}`}`}>
                Tournament Overlays & Worker
              </h1>

        <p className={`text-xl mb-8 text-center ${theme.colors.textSecondary}`}>
          Tournament overlays with theming support
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {overlays.map((overlay) => (
              <Link
                key={overlay.path}
                to={overlay.path}
                className={`block p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border backdrop-blur-xl ${
                  overlay.isSpecial
                    ? "bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-400/50 hover:border-orange-300/70 hover:from-orange-900/60 hover:to-red-900/60"
                    : `${theme.colors.cardBackground} ${theme.colors.primaryBorder} ${theme.colors.hoverBackground}`
                }`}
            >
              <h3
                className={`text-xl font-semibold mb-3 ${
                  overlay.isSpecial ? "text-orange-300" : theme.colors.textAccent
                }`}
              >
                {overlay.title}
                {overlay.isSpecial && (
                  <span className="ml-2 text-xs bg-orange-500/30 text-orange-800 px-2 py-1 rounded-full border border-orange-400/30">
                    Required
                  </span>
                )}
                {overlay.requiresParams && (
                  <span className={`ml-2 text-xs bg-blue-500/30 ${theme.colors.textPrimary} px-2 py-1 rounded-full border border-blue-400/30`}>
                    Params
                  </span>
                )}
              </h3>
              <p
                className={`text-sm mb-4 ${
                  overlay.isSpecial ? "text-orange-200" : theme.colors.textPrimary
                }`}
              >
                {overlay.description}
              </p>
              <div
                className={`text-sm font-medium ${
                  overlay.isSpecial
                    ? "text-orange-200 hover:text-orange-100"
                    : `${theme.colors.textAccent} hover:opacity-80`
                } transition-colors`}
              >
              </div>
            </Link>
          ))}
        </div>

        <div className={`mt-8 p-6 ${theme.colors.cardBackground} border ${theme.colors.primaryBorder} rounded-2xl backdrop-blur-xl`}>
          <h3 className={`font-semibold ${theme.colors.textAccent} mb-3 text-lg`}>
            ⚠️ Important - Worker Browser Source Required:
          </h3>
          <ul className={`${theme.colors.textPrimary} text-sm space-y-2`}>
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

        <div className={`mt-6 p-6 ${theme.colors.cardBackground} border ${theme.colors.primaryBorder} rounded-2xl backdrop-blur-xl`}>
          <h3 className={`font-semibold ${theme.colors.textAccent} mb-3 text-lg`}>Overlay Features:</h3>
          <ul className={`${theme.colors.textPrimary} text-sm space-y-2`}>
            <li>
              • <strong>Theme support</strong> with tournament-specific theming
            </li>
            <li>
              • <strong>Real-time updates</strong> via WebSocket broadcasting
            </li>
            <li>
              • <strong>Enhanced visual elements</strong> with improved color coding
            </li>
            <li>
              • <strong>Rank badges and icons</strong> for top performers and statistics
            </li>
            <li>
              • <strong>Responsive design</strong> optimized for streaming overlays
            </li>
          </ul>
        </div>

        <div className={`mt-6 p-6 ${theme.colors.cardBackground} border ${theme.colors.primaryBorder} rounded-2xl backdrop-blur-xl`}>
          <h3 className={`font-semibold ${theme.colors.textAccent} mb-3 text-lg`}>How it works:</h3>
          <ul className={`${theme.colors.textPrimary} text-sm space-y-2`}>
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
            <li>
              • <strong>Cross-Tables Profile:</strong> Two modes - Current match: ?player=1 or ?player=2. Specific player: /tournamentId/divisionName/playerId
            </li>
            <li>
              • <strong>Head-to-Head Comparison:</strong> Two modes - Current match players (no params needed). Specific players: /tournamentId/divisionName/playerId1/playerId2
            </li>
          </ul>
        </div>

        <div className={`mt-6 p-6 ${theme.colors.cardBackground} border ${theme.colors.primaryBorder} rounded-2xl backdrop-blur-xl`}>
          <h3 className={`font-semibold ${theme.colors.textAccent} mb-3 text-lg`}>For OBS Setup:</h3>
          <ul className={`${theme.colors.textPrimary} text-sm space-y-2`}>
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
            <li>
              • <strong>Overlays work best</strong> with transparent backgrounds
              in OBS for the theme effects
            </li>
            </ul>
          </div>
        </div>
      </div>
        );
      }}
    </BaseModernOverlay>
  );
};

export default OverlaysPage;