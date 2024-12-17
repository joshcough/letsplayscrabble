import React from "react";
import { useSearchParams } from "react-router-dom";
import StandingsOverlay from "../../components/overlay/StandingsOverlay";

const StandingsOverlayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const divisionName = searchParams.get("division");
  const tournamentId = searchParams.get("tournamentId");

  if (!divisionName || !tournamentId) {
    return (
      <div className="p-4 text-red-600">
        Error: Missing required parameters. Both 'division' and 'tournamentId'
        must be provided.
      </div>
    );
  }

  return (
    <StandingsOverlay divisionName={divisionName} tournamentId={tournamentId} />
  );
};

export default StandingsOverlayPage;
