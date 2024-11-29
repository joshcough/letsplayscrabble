import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TournamentDetails from "../../components/tournaments/TournamentDetails";

interface TournamentParams {
 id?: string;
}

const TournamentDetailsPage: React.FC = () => {
 const { id } = useParams<TournamentParams>();
 const navigate = useNavigate();

 return (
   <TournamentDetails
     tournamentId={id}
     onBack={() => navigate("/tournaments/manager")}
   />
 );
};

export default TournamentDetailsPage;