import React from "react";

import TournamentDetails from "../../components/tournaments/TournamentDetails";
import { ApiService } from "../../services/interfaces";

const TournamentDetailsPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  return <TournamentDetails apiService={apiService} />;
};

export default TournamentDetailsPage;
