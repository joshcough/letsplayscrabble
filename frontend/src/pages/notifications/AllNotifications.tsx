import React from "react";
import TournamentNotificationOverlay from "../../components/notifications/TournamentNotificationOverlay";
import { highScoreDetector } from "./HighScore";
import { winningStreakDetector } from "./WinningStreak";

const AllNotifications: React.FC = () => {
  return (
    <TournamentNotificationOverlay
      notificationDetectors={[
        highScoreDetector,
        winningStreakDetector,
        // Add future notification detectors here:
        // upsetDetector,
        // perfectGameDetector,
        // comebackDetector,
        // etc...
      ]}
    />
  );
};

export default AllNotifications;