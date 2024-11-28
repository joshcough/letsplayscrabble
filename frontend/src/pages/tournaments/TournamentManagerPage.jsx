// src/components/tournaments/TournamentManager.jsx
import React, { useState } from "react";
import AddTournament from "../../components/tournaments/AddTournament";
import TournamentList from "../../components/tournaments/TournamentList";
import TournamentDetails from "../../components/tournaments/TournamentDetails";

const TournamentManagerPage = () => {
  const [currentView, setCurrentView] = useState("list");
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const navigateToList = () => {
    setCurrentView("list");
    setSelectedTournamentId(null);
  };

  const navigateToAdd = () => {
    setCurrentView("add");
    setSelectedTournamentId(null);
  };

  const navigateToDetails = (id) => {
    setCurrentView("details");
    setSelectedTournamentId(id);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex gap-4">
        <button
          onClick={navigateToList}
          className="px-6 py-2 bg-[#4A3728] text-[#FAF1DB] rounded-md
                   hover:bg-[#6B5744] transition-colors shadow-md
                   border-2 border-[#4A3728]"
        >
          View All Tournaments
        </button>
        <button
          onClick={navigateToAdd}
          className="px-6 py-2 bg-[#FAF1DB] text-[#4A3728] rounded-md
                   hover:bg-[#FFF8E7] transition-colors shadow-md
                   border-2 border-[#4A3728]"
        >
          Add New Tournament
        </button>
      </div>

      {currentView === "list" && (
        <TournamentList onTournamentClick={navigateToDetails} />
      )}
      {currentView === "add" && <AddTournament onSuccess={navigateToList} />}
      {currentView === "details" && (
        <TournamentDetails
          tournamentId={selectedTournamentId}
          onBack={navigateToList}
        />
      )}
    </div>
  );
};

export default TournamentManagerPage;
