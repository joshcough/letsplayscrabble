import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TournamentDetails from "../../components/tournaments/TournamentDetails";

const TournamentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <TournamentDetails
      tournamentId={id}
      onBack={() => navigate("/tournaments/manager")}
    />
  );
};

export default TournamentDetailsPage;
