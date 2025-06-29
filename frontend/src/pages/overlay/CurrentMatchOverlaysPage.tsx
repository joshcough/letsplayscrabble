import React from "react";
import { Link } from "react-router-dom";

const CurrentMatchOverlaysPage: React.FC = () => {
  const overlays = [
    {
      title: "Stats Overlay (Misc)",
      path: "/overlay/misc",
      description: "Player stats and game history"
    },
    {
      title: "Rating Gain Leaders",
      path: "/overlay/rating_gain",
      description: "Players ranked by rating change"
    },
    {
      title: "Rating Gain with Pictures",
      path: "/overlay/rating_gain_with_pics",
      description: "Rating gain leaders with player photos"
    },
    {
      title: "High Scores with Pictures",
      path: "/overlay/high_scores_with_pics",
      description: "High score leaders with player photos"
    },
    {
      title: "Standings with Pictures",
      path: "/overlay/current_match_standings",
      description: "Player stats and game history"
    },
    {
      title: "Scoring Leaders",
      path: "/overlay/scoring_leaders",
      description: "Players ranked by average score"
    },
    {
      title: "Scoring Leaders with Pictures",
      path: "/overlay/scoring_leaders_with_pics",
      description: "Scoring leaders with player photos"
    },
    {
      title: "Tournament Division Stats",
      path: "/overlay/tournament_division_stats",
      description: "Overall tournament statistics"
    }
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Current Match Overlay Pages
      </h1>

      <p className="text-lg mb-6 text-center text-gray-600">
        These overlays automatically use the currently selected match data
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {overlays.map((overlay) => (
          <Link
            key={overlay.path}
            to={overlay.path}
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300"
          >
            <h3 className="text-xl font-semibold mb-2 text-blue-600">
              {overlay.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {overlay.description}
            </p>
            <div className="mt-4 text-sm text-blue-500 hover:text-blue-700">
              Open overlay →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Note:</h3>
        <p className="text-blue-700 text-sm">
          These overlays use the current match selected in the admin interface.
          Make sure to set a current match before using these overlays.
        </p>
      </div>
    </div>
  );
};

export default CurrentMatchOverlaysPage;