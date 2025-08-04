import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import AdminLogin from "./components/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/common/Navigation";
import AddTournament from "./components/tournaments/AddTournament";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import WorkerPage from "./pages/WorkerPage";
import AdminPage from "./pages/admin/AdminPage";
import HighScoreAnimation from "./pages/notifications/HighScoreAnimation";
import HighScoresWithPicsOverlayPage from "./pages/overlay/HighScoresWithPicsOverlayPage";
import MiscOverlayPage from "./pages/overlay/MiscOverlayPage";
import MiscOverlayTestingPage from "./pages/overlay/MiscOverlayTestingPage";
import OverlaysPage from "./pages/overlay/OverlaysPage";
import PingOverlayPage from "./pages/overlay/PingOverlayPage";
import PlayerOverlay from "./pages/overlay/PlayerOverlayPage";
import PlayerOverlayTestingPage from "./pages/overlay/PlayerOverlayTestingPage";
import RatingGainOverlayPage from "./pages/overlay/RatingGainOverlayPage";
import RatingGainWithPicsOverlayPage from "./pages/overlay/RatingGainWithPicsOverlayPage";
import ScoringLeadersOverlayPage from "./pages/overlay/ScoringLeadersOverlayPage";
import ScoringLeadersWithPicsOverlayPage from "./pages/overlay/ScoringLeadersWithPicsOverlayPage";
import StandingsOverlayPage from "./pages/overlay/StandingsOverlayPage";
import StandingsWithPicsOverlayPage from "./pages/overlay/StandingsWithPicsOverlayPage";
import TournamentStatsOverlayPage from "./pages/overlay/TournamentStatsOverlayPage";
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage";
import TournamentManagerPage from "./pages/tournaments/TournamentManagerPage";

// Wrapper component to conditionally apply theme
const AppContent: React.FC = () => {
  const location = useLocation();

  const isOverlay =
    location.pathname.startsWith("/overlay/") ||
    location.pathname.includes("/overlay/") ||
    location.pathname.includes("/notifications/") ||
    location.pathname.startsWith("/worker");

  const getBackgroundClass = () => {
    if (location.pathname.includes("/notifications/")) {
      return "min-h-screen bg-transparent";
    }
    return isOverlay ? "min-h-screen bg-white" : "min-h-screen bg-[#E4C6A0]";
  };

  return (
    <div className={getBackgroundClass()}>
      {!isOverlay && <Navigation />}
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        {/* User-scoped overlay routes */}
        <Route
          path="/users/:userId/overlay/ping"
          element={<PingOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/misc"
          element={<MiscOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/player/:tournamentId?/:divisionName?"
          element={<PlayerOverlay />}
        />
        <Route
          path="/users/:userId/overlay/player/:tournamentId/:divisionName/:playerId/test"
          element={<PlayerOverlayTestingPage />}
        />
        <Route
          path="/users/:userId/overlay/standings/:tournamentId?/:divisionName?"
          element={<StandingsOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/standings_with_pics/:tournamentId?/:divisionName?"
          element={<StandingsWithPicsOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/rating_gain/:tournamentId?/:divisionName?"
          element={<RatingGainOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/rating_gain_with_pics/:tournamentId?/:divisionName?"
          element={<RatingGainWithPicsOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/high_scores_with_pics/:tournamentId?/:divisionName?"
          element={<HighScoresWithPicsOverlayPage />}
        />
        {/* Animation routes - transparent background */}
        <Route
          path="/users/:userId/notifications/high_score/:tournamentId?/:divisionName?"
          element={<HighScoreAnimation />}
        />
        <Route
          path="/users/:userId/overlay/scoring_leaders/:tournamentId?/:divisionName?"
          element={<ScoringLeadersOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/scoring_leaders_with_pics/:tournamentId?/:divisionName?"
          element={<ScoringLeadersWithPicsOverlayPage />}
        />
        <Route
          path="/users/:userId/overlay/tournament_stats/:tournamentId?/:divisionName?"
          element={<TournamentStatsOverlayPage />}
        />
        {/* Legacy overlay routes (backwards compatibility - optional) */}
        <Route path="/overlay/misc" element={<MiscOverlayPage />} />
        <Route
          path="/overlay/standings/:tournamentId?/:divisionName?"
          element={<StandingsOverlayPage />}
        />
        <Route
          path="/overlay/standings_with_pics/:tournamentId?/:divisionName?"
          element={<StandingsWithPicsOverlayPage />}
        />
        <Route
          path="/overlay/rating_gain/:tournamentId?/:divisionName?"
          element={<RatingGainOverlayPage />}
        />
        <Route
          path="/overlay/rating_gain_with_pics/:tournamentId?/:divisionName?"
          element={<RatingGainWithPicsOverlayPage />}
        />
        <Route
          path="/overlay/high_scores_with_pics/:tournamentId?/:divisionName?"
          element={<HighScoresWithPicsOverlayPage />}
        />
        <Route
          path="/overlay/scoring_leaders/:tournamentId?/:divisionName?"
          element={<ScoringLeadersOverlayPage />}
        />
        <Route
          path="/overlay/scoring_leaders_with_pics/:tournamentId?/:divisionName?"
          element={<ScoringLeadersWithPicsOverlayPage />}
        />
        <Route
          path="/overlay/tournament_stats/:tournamentId?/:divisionName?"
          element={<TournamentStatsOverlayPage />}
        />
        {/* Other routes */}
        <Route path="/overlays" element={<OverlaysPage />} />
        <Route
          path="/overlay/misc_testing"
          element={<MiscOverlayTestingPage />}
        />
        <Route path="/worker" element={<WorkerPage />} />
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
