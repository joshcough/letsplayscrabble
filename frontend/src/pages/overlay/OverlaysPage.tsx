import React from "react";
import { Link } from "react-router-dom";

const OverlaysPage: React.FC = () => {
  const overlays = [
    {
      title: "Misc Overlay",
      path: "/overlay/misc_testing",
      description: "Lots of small things we use in OBS"
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
      title: "Standings",
      path: "/overlay/standings",
      description: "Division standings in table"
    },
    {
      title: "Standings with Pictures",
      path: "/overlay/standings_with_pics",
      description: "Division standings with pictures"
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
      title: "Tournament Stats",
      path: "/overlay/tournament_stats",
      description: "Tournament statistics and analytics"
    }
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#4A3728]">
        Tournament Overlays
      </h1>

      <p className="text-lg mb-6 text-center text-[#6B5744]">
        These overlays work with both current match data and URL parameters
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {overlays.map((overlay) => (
          <Link
            key={overlay.path}
            to={overlay.path}
            className="block p-6 bg-[#FAF1DB] rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[#4A3728]/20 hover:border-[#4A3728]/40 hover:bg-[#4A3728]/5"
          >
            <h3 className="text-xl font-semibold mb-2 text-[#4A3728]">
              {overlay.title}
            </h3>
            <p className="text-[#6B5744] text-sm">
              {overlay.description}
            </p>
            <div className="mt-4 text-sm text-[#4A3728] hover:text-[#4A3728]/80">
              Open overlay →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-[#FFF8E7] border border-[#4A3728]/20 rounded-lg">
        <h3 className="font-semibold text-[#4A3728] mb-2">How it works:</h3>
        <ul className="text-[#6B5744] text-sm space-y-1">
          <li>• <strong>Default:</strong> Uses currently selected match in admin interface</li>
          <li>• <strong>With URL params:</strong> Most overlays support /tournamentId/divisionName for specific tournament data</li>
          <li>• <strong>Example:</strong> /overlay/standings/123/A shows standings for tournament 123, division A</li>
          <li>• <strong>Note:</strong> Misc overlay only works with current match (requires specific round/pairing data)</li>
        </ul>
      </div>
    </div>
  );
};

export default OverlaysPage;