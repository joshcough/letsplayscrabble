import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import OverlayPage from "./pages/OverlayPage";
import {
  TournamentList,
  AddTournament,
  TournamentDetails,
} from "./components/tournaments";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/overlay" element={<OverlayPage />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/add" element={<AddTournament />} />
        <Route path="/tournaments/:id" element={<TournamentDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
