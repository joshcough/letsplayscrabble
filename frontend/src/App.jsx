// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navigation from "./components/common/Navigation";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/admin/AdminPage";
import OverlayPage from "./pages/overlay/OverlayPage";
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage";
import TournamentManagerPage from "./pages/tournaments/TournamentManagerPage";
import StandingsPage from "./pages/tournaments/StandingsPage";
import AddTournament from "./components/tournaments/AddTournament";

// Wrapper component to conditionally apply theme
const AppContent = () => {
  const location = useLocation();
  const isOverlay = location.pathname.startsWith("/overlay");

  return (
    <div
      className={
        isOverlay ? "min-h-screen bg-white" : "min-h-screen bg-[#E4C6A0]"
      }
    >
      {!isOverlay && <Navigation />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/overlay" element={<OverlayPage />} />
        <Route
          path="/tournaments/manager"
          element={<TournamentManagerPage />}
        />
        <Route path="/tournaments/add" element={<AddTournament />} />
        <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
        <Route
          path="/tournaments/:tournamentId/standings/:divisionName"
          element={<StandingsPage />}
        />
        <Route
          path="/tournaments/name/:name"
          element={<TournamentDetailsPage />}
        />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
