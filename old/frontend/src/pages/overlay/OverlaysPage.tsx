import React from "react";
import { Link } from "react-router-dom";

import { ThemeProvider } from "../../components/shared/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { ApiService } from "../../services/interfaces";
import { Theme } from "../../types/theme";

const OverlaysPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const { userId } = useAuth();

  return (
    <ThemeProvider>
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

  const overlayGroups = [
    {
      category: "Leaderboards",
      overlays: [
        {
          title: "Standings",
          variants: [
            { label: "Table", path: `/users/${userId}/overlay/standings` },
            { label: "With Pics", path: `/users/${userId}/overlay/standings_with_pics` },
          ],
        },
        {
          title: "Rating Gain",
          variants: [
            { label: "Table", path: `/users/${userId}/overlay/rating_gain` },
            { label: "With Pics", path: `/users/${userId}/overlay/rating_gain_with_pics` },
          ],
        },
        {
          title: "Scoring Leaders",
          variants: [
            { label: "Table", path: `/users/${userId}/overlay/scoring_leaders` },
            { label: "With Pics", path: `/users/${userId}/overlay/scoring_leaders_with_pics` },
          ],
        },
        {
          title: "High Scores",
          variants: [
            { label: "Table", path: `/users/${userId}/overlay/high_scores` },
            { label: "With Pics", path: `/users/${userId}/overlay/high_scores_with_pics` },
          ],
        },
      ],
    },
    {
      category: "Player Stats & Comparisons",
      overlays: [
        {
          title: "Cross-Tables Profile",
          path: `/users/${userId}/overlay/cross_tables_profile?player=1`,
          description: "Player ratings & stats",
          requiresParams: true,
        },
        {
          title: "Head-to-Head",
          path: `/users/${userId}/overlay/head_to_head`,
          description: "Compare two players",
          requiresParams: true,
        },
        {
          title: "Tournament Stats",
          path: `/users/${userId}/overlay/tournament_stats`,
          description: "Tournament analytics",
        },
      ],
    },
    {
      category: "Other",
      overlays: [
        {
          title: "Worker Page",
          path: "/worker",
          description: "Required for real-time updates",
          isSpecial: true,
        },
        {
          title: "Game Board",
          path: `/users/${userId}/overlay/game_board`,
          description: "Live game board (in development)",
        },
        {
          title: "Misc Overlay Testing",
          path: "/overlay/misc_testing",
          description: "Test misc overlay sources",
        },
      ],
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

        <div className="space-y-8">
          {overlayGroups.map((group) => (
            <div key={group.category}>
              <h2 className={`text-2xl font-bold mb-4 ${theme.colors.textAccent}`}>
                {group.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.overlays.map((overlay) => (
                  <div
                    key={overlay.title}
                    className={`p-4 rounded-xl shadow-lg border backdrop-blur-xl ${
                      (overlay as any).isSpecial
                        ? "bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-400/50"
                        : `${theme.colors.cardBackground} ${theme.colors.primaryBorder}`
                    }`}
                  >
                    <h3 className={`text-lg font-semibold mb-2 ${(overlay as any).isSpecial ? "text-orange-300" : theme.colors.textAccent}`}>
                      {overlay.title}
                      {(overlay as any).isSpecial && (
                        <span className="ml-2 text-xs bg-orange-500/30 text-orange-800 px-2 py-1 rounded-full border border-orange-400/30">
                          Required
                        </span>
                      )}
                      {(overlay as any).requiresParams && (
                        <span className={`ml-2 text-xs bg-blue-500/30 ${theme.colors.textPrimary} px-2 py-1 rounded-full border border-blue-400/30`}>
                          Params
                        </span>
                      )}
                    </h3>

                    {(overlay as any).description && (
                      <p className={`text-sm mb-3 ${(overlay as any).isSpecial ? "text-orange-200" : theme.colors.textPrimary}`}>
                        {(overlay as any).description}
                      </p>
                    )}

                    {(overlay as any).variants ? (
                      <div className="flex gap-2">
                        {(overlay as any).variants.map((variant: any) => (
                          <Link
                            key={variant.path}
                            to={variant.path}
                            className={`flex-1 text-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${theme.colors.cardBackground} ${theme.colors.primaryBorder} border ${theme.colors.hoverBackground}`}
                          >
                            {variant.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        to={(overlay as any).path}
                        className={`block text-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          (overlay as any).isSpecial
                            ? "bg-orange-700/30 border border-orange-400/50 text-orange-200 hover:bg-orange-700/50"
                            : `${theme.colors.cardBackground} ${theme.colors.primaryBorder} border ${theme.colors.hoverBackground}`
                        }`}
                      >
                        Open
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
    </ThemeProvider>
  );
};

export default OverlaysPage;