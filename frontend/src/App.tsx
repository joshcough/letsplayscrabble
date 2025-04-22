// App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/common/Navigation";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/admin/AdminPage";
import OverlayPage from "./pages/overlay/OverlayPage";
import RatingGainOverlayPage from "./pages/overlay/RatingGainOverlayPage";
import ScoringLeadersOverlayPage from "./pages/overlay/ScoringLeadersOverlayPage";
import StandingsOverlayPage from "./pages/overlay/StandingsOverlayPage";
import HSStandingsOverlayPage from "./pages/overlay/HSStandingsOverlayPage";
import ElemStandingsOverlayPage from "./pages/overlay/ElemStandingsOverlayPage";
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage";
import TournamentManagerPage from "./pages/tournaments/TournamentManagerPage";
import StandingsPage from "./pages/tournaments/StandingsPage";
import AddTournament from "./components/tournaments/AddTournament";
import AdminLogin from "./components/AdminLogin";

// Wrapper component to conditionally apply theme
const AppContent: React.FC = () => {
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
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/overlay/misc" element={<OverlayPage />} />
        <Route
          path="/overlay/standings/:tournamentId/:divisionName"
          element={<StandingsOverlayPage />}
        />
        <Route
          path="/overlay/hs_standings/:tournamentId/:divisionName"
          element={<HSStandingsOverlayPage />}
        />
        <Route
          path="/overlay/elem_standings/:tournamentId/:divisionName"
          element={<ElemStandingsOverlayPage />}
        />
        <Route
          path="/overlay/rating_gain"
          element={<RatingGainOverlayPage />}
        />
        <Route
          path="/overlay/scoring_leaders"
          element={<ScoringLeadersOverlayPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/manager"
          element={
            <ProtectedRoute>
              <TournamentManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/add"
          element={
            <ProtectedRoute>
              <AddTournament />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:id"
          element={
            <ProtectedRoute>
              <TournamentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:tournamentId/standings/:divisionName"
          element={
            <ProtectedRoute>
              <StandingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/name/:name"
          element={
            <ProtectedRoute>
              <TournamentDetailsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;