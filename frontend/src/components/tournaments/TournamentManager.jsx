// frontend/src/components/tournaments/TournamentManager.jsx
import React, { useState } from "react";
import AddTournament from "./AddTournament";
import TournamentList from "./TournamentList";
import TournamentDetails from "./TournamentDetails";

const TournamentManager = () => {
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
      <div className="mb-4 space-x-2">
        <button
          onClick={navigateToList}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          View All Tournaments
        </button>
        <button
          onClick={navigateToAdd}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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

export default TournamentManager;
