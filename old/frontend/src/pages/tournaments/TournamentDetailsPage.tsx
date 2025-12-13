import React, { useEffect } from "react";

import TournamentDetails from "../../components/tournaments/TournamentDetails";
import { ApiService } from "../../services/interfaces";

const TournamentDetailsPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  useEffect(() => {
    document.title = "LPS: Tournament Details";
  }, []);

  return <TournamentDetails apiService={apiService} />;
};

export default TournamentDetailsPage;
