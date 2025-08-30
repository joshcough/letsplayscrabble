import React from "react";
import { useNavigate } from "react-router-dom";

import TournamentList from "../../components/tournaments/TournamentList";
import { ApiService } from "../../services/interfaces";
import { useThemeContext } from "../../context/ThemeContext";

const TournamentManagerPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const navigate = useNavigate();
  const { theme } = useThemeContext();

  const handleTournamentClick = (id: number) => {
    navigate(`/tournaments/${id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => navigate("/tournaments/manager")}
          className={`px-6 py-2 ${theme.colors.cardBackground} ${theme.colors.textPrimary} rounded-md ${theme.colors.hoverBackground} transition-colors ${theme.colors.shadowColor} shadow-md border-2 ${theme.colors.primaryBorder}`}
        >
          View All Tournaments
        </button>
        <button
          onClick={() => navigate("/tournaments/add")}
          className={`px-6 py-2 ${theme.colors.cardBackground} ${theme.colors.textPrimary} rounded-md ${theme.colors.hoverBackground} transition-colors ${theme.colors.shadowColor} shadow-md border-2 ${theme.colors.primaryBorder}`}
        >
          Add New Tournament
        </button>
      </div>
      <TournamentList
        onTournamentClick={handleTournamentClick}
        apiService={apiService}
      />
    </div>
  );
};

export default TournamentManagerPage;
