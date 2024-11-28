import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPage from "./pages/admin/AdminPage";
import OverlayPage from "./pages/overlay/OverlayPage";
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage";
import TournamentManagerPage from "./pages/tournaments/TournamentManagerPage";
import StandingsPage from "./pages/tournaments/StandingsPage";
import AddTournament from "./components/tournaments/AddTournament";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/overlay" element={<OverlayPage />} />
        <Route path="/tournaments" element={<TournamentManagerPage />} />
        <Route path="/tournaments/add" element={<AddTournament />} />
        <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
        <Route path="/tournaments/:tournamentId/standings/:divisionName" element={<StandingsPage />} />
        <Route path="/tournaments/name/:name" element={<TournamentDetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;