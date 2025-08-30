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
import AllNotifications from "./pages/notifications/AllNotifications";
import HighScoresWithPicsOverlayPage from "./pages/overlay/original/HighScoresWithPicsOverlayPage";
import MiscOverlayPage from "./pages/overlay/original/MiscOverlayPage";
import MiscOverlayTestingPage from "./pages/overlay/original/MiscOverlayTestingPage";
import OverlaysPage from "./pages/overlay/original/OverlaysPage";
import ModernOverlaysPage from "./pages/overlay/modern/ModernOverlaysPage";
import PingOverlayPage from "./pages/overlay/original/PingOverlayPage";
import PlayerOverlay from "./pages/overlay/original/PlayerOverlayPage";
import PlayerOverlayTestingPage from "./pages/overlay/original/PlayerOverlayTestingPage";
import CrossTablesPlayerProfileOverlay from "./pages/overlay/original/CrossTablesPlayerProfileOverlayPage";
import HeadToHeadOverlay from "./pages/overlay/original/HeadToHeadOverlayPage";
import HeadToHeadModernOverlay from "./pages/overlay/modern/HeadToHeadModernOverlayPage";
import RatingGainOverlayPage from "./pages/overlay/original/RatingGainOverlayPage";
import RatingGainWithPicsOverlayPage from "./pages/overlay/original/RatingGainWithPicsOverlayPage";
import ScoringLeadersOverlayPage from "./pages/overlay/original/ScoringLeadersOverlayPage";
import ScoringLeadersWithPicsOverlayPage from "./pages/overlay/original/ScoringLeadersWithPicsOverlayPage";
import StandingsOverlayPage from "./pages/overlay/original/StandingsOverlayPage";
import StandingsWithPicsOverlayPage from "./pages/overlay/original/StandingsWithPicsOverlayPage";
import TournamentStatsOverlayPage from "./pages/overlay/original/TournamentStatsOverlayPage";
// Modern overlay imports
import CrossTablesPlayerProfileModernOverlay from "./pages/overlay/modern/CrossTablesPlayerProfileModernOverlayPage";
import HighScoresWithPicsModernOverlayPage from "./pages/overlay/modern/HighScoresWithPicsModernOverlayPage";
import MiscModernOverlayPage from "./pages/overlay/modern/MiscModernOverlayPage";
import PingModernOverlayPage from "./pages/overlay/modern/PingModernOverlayPage";
import PlayerModernOverlay from "./pages/overlay/modern/PlayerModernOverlayPage";
import RatingGainModernOverlayPage from "./pages/overlay/modern/RatingGainModernOverlayPage";
import RatingGainWithPicsModernOverlayPage from "./pages/overlay/modern/RatingGainWithPicsModernOverlayPage";
import ScoringLeadersModernOverlayPage from "./pages/overlay/modern/ScoringLeadersModernOverlayPage";
import ScoringLeadersWithPicsModernOverlayPage from "./pages/overlay/modern/ScoringLeadersWithPicsModernOverlayPage";
import StandingsModernOverlayPage from "./pages/overlay/modern/StandingsModernOverlayPage";
import StandingsWithPicsModernOverlayPage from "./pages/overlay/modern/StandingsWithPicsModernOverlayPage";
import TournamentStatsModernOverlayPage from "./pages/overlay/modern/TournamentStatsModernOverlayPage";
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage";
import TournamentManagerPage from "./pages/tournaments/TournamentManagerPage";
import { HttpApiService } from "./services/httpService";
import { ApiService } from "./services/interfaces";

// Wrapper component to conditionally apply theme
const AppContent: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
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
        <Route path="/login" element={<AdminLogin apiService={apiService} />} />
        {/* User-scoped overlay routes */}
        <Route
          path="/users/:userId/overlay/ping"
          element={<PingOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/misc"
          element={<MiscOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/player/:tournamentId?/:divisionName?"
          element={<PlayerOverlay apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/player/:tournamentId/:divisionName/:playerId/test"
          element={<PlayerOverlayTestingPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/cross_tables_profile/:tournamentId?/:divisionName?/:playerId?"
          element={<CrossTablesPlayerProfileOverlay apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/head_to_head/:tournamentId?/:divisionName?/:playerId1?/:playerId2?"
          element={<HeadToHeadOverlay apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/head_to_head_modern/:tournamentId?/:divisionName?/:playerId1?/:playerId2?"
          element={<HeadToHeadModernOverlay apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/standings/:tournamentId?/:divisionName?"
          element={<StandingsOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/standings_with_pics/:tournamentId?/:divisionName?"
          element={<StandingsWithPicsOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/rating_gain/:tournamentId?/:divisionName?"
          element={<RatingGainOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/rating_gain_with_pics/:tournamentId?/:divisionName?"
          element={<RatingGainWithPicsOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/high_scores_with_pics/:tournamentId?/:divisionName?"
          element={<HighScoresWithPicsOverlayPage apiService={apiService} />}
        />
        {/* Animation routes - transparent background */}
        <Route
          path="/users/:userId/notifications/all/:tournamentId?/:divisionName?"
          element={<AllNotifications apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/scoring_leaders/:tournamentId?/:divisionName?"
          element={<ScoringLeadersOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/scoring_leaders_with_pics/:tournamentId?/:divisionName?"
          element={
            <ScoringLeadersWithPicsOverlayPage apiService={apiService} />
          }
        />
        <Route
          path="/users/:userId/overlay/tournament_stats/:tournamentId?/:divisionName?"
          element={<TournamentStatsOverlayPage apiService={apiService} />}
        />
        
        {/* Modern overlay routes */}
        <Route
          path="/users/:userId/overlay/ping_modern"
          element={<PingModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/misc_modern"
          element={<MiscModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/player_modern/:tournamentId?/:divisionName?"
          element={<PlayerModernOverlay apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/cross_tables_profile_modern/:tournamentId?/:divisionName?/:playerId?"
          element={<CrossTablesPlayerProfileModernOverlay apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/standings_modern/:tournamentId?/:divisionName?"
          element={<StandingsModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/standings_with_pics_modern/:tournamentId?/:divisionName?"
          element={<StandingsWithPicsModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/rating_gain_modern/:tournamentId?/:divisionName?"
          element={<RatingGainModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/rating_gain_with_pics_modern/:tournamentId?/:divisionName?"
          element={<RatingGainWithPicsModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/high_scores_with_pics_modern/:tournamentId?/:divisionName?"
          element={<HighScoresWithPicsModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/scoring_leaders_modern/:tournamentId?/:divisionName?"
          element={<ScoringLeadersModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/scoring_leaders_with_pics_modern/:tournamentId?/:divisionName?"
          element={<ScoringLeadersWithPicsModernOverlayPage apiService={apiService} />}
        />
        <Route
          path="/users/:userId/overlay/tournament_stats_modern/:tournamentId?/:divisionName?"
          element={<TournamentStatsModernOverlayPage apiService={apiService} />}
        />
        
        {/* Legacy overlay routes (backwards compatibility - optional) */}
        <Route
          path="/overlay/misc"
          element={<MiscOverlayPage apiService={apiService} />}
        />
        <Route
          path="/overlay/standings/:tournamentId?/:divisionName?"
          element={<StandingsOverlayPage apiService={apiService} />}
        />
        <Route
          path="/overlay/standings_with_pics/:tournamentId?/:divisionName?"
          element={<StandingsWithPicsOverlayPage apiService={apiService} />}
        />
        <Route
          path="/overlay/rating_gain/:tournamentId?/:divisionName?"
          element={<RatingGainOverlayPage apiService={apiService} />}
        />
        <Route
          path="/overlay/rating_gain_with_pics/:tournamentId?/:divisionName?"
          element={<RatingGainWithPicsOverlayPage apiService={apiService} />}
        />
        <Route
          path="/overlay/high_scores_with_pics/:tournamentId?/:divisionName?"
          element={<HighScoresWithPicsOverlayPage apiService={apiService} />}
        />
        <Route
          path="/overlay/scoring_leaders/:tournamentId?/:divisionName?"
          element={<ScoringLeadersOverlayPage apiService={apiService} />}
        />
        <Route
          path="/overlay/scoring_leaders_with_pics/:tournamentId?/:divisionName?"
          element={
            <ScoringLeadersWithPicsOverlayPage apiService={apiService} />
          }
        />
        <Route
          path="/overlay/tournament_stats/:tournamentId?/:divisionName?"
          element={<TournamentStatsOverlayPage apiService={apiService} />}
        />
        {/* Other routes */}
        <Route
          path="/overlays"
          element={<OverlaysPage apiService={apiService} />}
        />
        <Route
          path="/overlays/modern"
          element={<ModernOverlaysPage apiService={apiService} />}
        />
        <Route
          path="/overlay/misc_testing"
          element={<MiscOverlayTestingPage apiService={apiService} />}
        />
        <Route
          path="/worker"
          element={<WorkerPage apiService={apiService} />}
        />
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage apiService={apiService} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage apiService={apiService} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/manager"
          element={
            <ProtectedRoute>
              <TournamentManagerPage apiService={apiService} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/add"
          element={
            <ProtectedRoute>
              <AddTournament apiService={apiService} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:id"
          element={
            <ProtectedRoute>
              <TournamentDetailsPage apiService={apiService} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/name/:name"
          element={
            <ProtectedRoute>
              <TournamentDetailsPage apiService={apiService} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  const apiService = new HttpApiService();

  return (
    <AuthProvider>
      <Router>
        <AppContent apiService={apiService} />
      </Router>
    </AuthProvider>
  );
};

export default App;
