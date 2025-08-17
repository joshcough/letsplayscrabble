import React from "react";
import { useNavigate } from "react-router-dom";

import TournamentList from "../../components/tournaments/TournamentList";
import { ApiService } from "../../services/interfaces";

const TournamentManagerPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const navigate = useNavigate();

  const handleTournamentClick = (id: number) => {
    navigate(`/tournaments/${id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => navigate("/tournaments/manager")}
          className="px-6 py-2 bg-[#4A3728] text-[#FAF1DB] rounded-md hover:bg-[#6B5744] transition-colors shadow-md border-2 border-[#4A3728]"
        >
          View All Tournaments
        </button>
        <button
          onClick={() => navigate("/tournaments/add")}
          className="px-6 py-2 bg-[#FAF1DB] text-[#4A3728] rounded-md hover:bg-[#FFF8E7] transition-colors shadow-md border-2 border-[#4A3728]"
        >
          Add New Tournament
        </button>
      </div>
      <TournamentList onTournamentClick={handleTournamentClick} apiService={apiService} />
    </div>
  );
};

export default TournamentManagerPage;
