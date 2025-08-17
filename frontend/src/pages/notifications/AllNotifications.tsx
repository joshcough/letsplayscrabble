import React from "react";

import TournamentNotificationOverlay from "../../components/notifications/TournamentNotificationOverlay";
import { ApiService } from "../../services/interfaces";
import { highScoreDetector } from "./HighScore";
import { winningStreakDetector } from "./WinningStreak";

const AllNotifications: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  return (
    <TournamentNotificationOverlay
      apiService={apiService}
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
