import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import BroadcastManager from "../../hooks/BroadcastManager";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import { ApiService } from "../../services/interfaces";
import { TournamentDataIncremental } from "../../types/broadcast";
import { Division } from "@shared/types/domain";

type RouteParams = {
  userId: string;
  tournamentId?: string;
  divisionName?: string;
};

// Simple notification detector function type
export type NotificationDetector = (
  update: TournamentDataIncremental,
  divisionData: Division,
) => JSX.Element | null;

// Tournament notification overlay component
interface TournamentNotificationOverlayProps {
  notificationDetectors: NotificationDetector[];
  apiService: ApiService;
}

const TournamentNotificationOverlay = ({
  notificationDetectors,
  apiService,
}: TournamentNotificationOverlayProps) => {
  const {
    userId,
    tournamentId: urlTournamentId,
    divisionName,
  } = useParams<RouteParams>();

  // State for notification queue and current notification
  const [notificationQueue, setNotificationQueue] = useState<JSX.Element[]>([]);
  const [currentNotification, setCurrentNotification] =
    useState<JSX.Element | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Data source logic
  const shouldUseCurrentMatch = !urlTournamentId || !divisionName;

  const { currentMatch, loading: currentMatchLoading } =
    useCurrentMatch(apiService);

  const {
    tournamentData: urlTournamentData,
    selectedDivisionId: urlDivisionId,
    loading: urlLoading,
  } = useTournamentData({
    tournamentId: urlTournamentId ? parseInt(urlTournamentId) : undefined,
    useUrlParams: !shouldUseCurrentMatch,
    apiService,
  });

  const {
    tournamentData: currentMatchTournamentData,
    loading: currentMatchTournamentLoading,
  } = useTournamentData({
    tournamentId: currentMatch?.tournamentId,
    divisionId: currentMatch?.divisionId,
    useUrlParams: false,
    apiService,
  });

  // Effective data (now division-scoped instead of full tournament)
  const effectiveTournamentData = shouldUseCurrentMatch
    ? currentMatchTournamentData
    : urlTournamentData;
  const effectiveDivisionId = shouldUseCurrentMatch
    ? currentMatch?.divisionId
    : urlDivisionId;
  const effectiveLoading = shouldUseCurrentMatch
    ? currentMatchLoading || currentMatchTournamentLoading
    : urlLoading;

  // Extract division from division-scoped data
  const divisionData = effectiveTournamentData?.division;

  // Listen for incremental updates
  useEffect(() => {
    if (
      !userId ||
      !effectiveDivisionId ||
      !divisionData ||
      notificationDetectors.length === 0
    ) {
      console.log(
        "🎯 TournamentNotification: Not ready to listen for updates:",
        {
          userId: !!userId,
          effectiveDivisionId,
          divisionDataReady: !!divisionData,
          detectorsLength: notificationDetectors.length,
        },
      );
      return;
    }

    console.log(
      "🎯 TournamentNotification: Setting up listener for division",
      effectiveDivisionId,
    );

    const cleanup = BroadcastManager.getInstance().onTournamentDataIncremental(
      (data: TournamentDataIncremental) => {
        console.log("🎯 TournamentNotification: Received update:", {
          dataUserId: data.userId,
          ourUserId: parseInt(userId),
          affectedDivisions: data.affectedDivisions,
          ourDivisionId: effectiveDivisionId,
        });

        // Filter for our user and tournament
        if (data.userId !== parseInt(userId)) {
          console.log("🎯 TournamentNotification: Ignoring - different user");
          return;
        }

        if (!data.affectedDivisions.includes(effectiveDivisionId)) {
          console.log(
            "🎯 TournamentNotification: Ignoring - division not affected",
          );
          return;
        }

        // TODO: previousData removed from broadcasts to reduce memory by ~50%
        // Notifications are disabled until we implement metadata calculation in worker
        if (!data.data) {
          console.log(
            "🎯 TournamentNotification: Missing data",
          );
          return;
        }

        console.log(
          "🎯 TournamentNotification: Notifications disabled - previousData not available (memory optimization)"
        );
        return;

        // Unreachable code below - kept for when notifications are re-enabled
        /*
        // Collect ALL notifications from this update
        const detectedNotifications: JSX.Element[] = [];

        for (const detector of notificationDetectors) {
          const notification = detector(data, divisionData);
          if (notification) {
            console.log("🎯 Notification detected");
            detectedNotifications.push(notification);
          }
        }

        // Add all detected notifications to the queue
        if (detectedNotifications.length > 0) {
          console.log(
            `🎯 Adding ${detectedNotifications.length} notifications to queue`,
          );
          setNotificationQueue((prev) => [...prev, ...detectedNotifications]);
        }
        */
      },
    );

    return cleanup;
  }, [userId, effectiveDivisionId, divisionData, notificationDetectors]);

  // Process notification queue - start next notification when none is currently showing
  useEffect(() => {
    if (!currentNotification && notificationQueue.length > 0) {
      const nextNotification = notificationQueue[0];
      console.log("🎬 Starting next notification from queue");

      // Remove from queue and set as current
      setNotificationQueue((prev) => prev.slice(1));
      setCurrentNotification(nextNotification);

      // Start animation after a brief delay
      setTimeout(() => setIsAnimating(true), 50);
    }
  }, [currentNotification, notificationQueue]);

  // Handle animation timing
  useEffect(() => {
    if (currentNotification && isAnimating) {
      const duration = 5000; // Default duration

      console.log("🎬 Starting animation timer for duration:", duration);

      const hideTimeout = setTimeout(() => {
        console.log("🎬 Animation timer expired - hiding popup");
        setIsAnimating(false);
        setTimeout(() => {
          console.log("🎬 Fade out complete - clearing notification");
          setCurrentNotification(null);
        }, 700);
      }, duration);

      return () => {
        console.log("🎬 Cleaning up animation timer");
        clearTimeout(hideTimeout);
      };
    }
  }, [currentNotification, isAnimating]);

  // Don't render if loading or no data
  if (effectiveLoading || !effectiveTournamentData || !divisionData) {
    return <div className="w-full h-full bg-transparent" />;
  }

  if (!currentNotification) {
    return <div className="w-full h-full bg-transparent" />;
  }

  console.log("🎬 Rendering notification, isAnimating:", isAnimating);

  return (
    <div className="w-full h-full bg-transparent relative">
      <div
        className={`
          fixed inset-0 flex items-center justify-center z-50
          transition-all duration-700 ease-out
          ${
            !currentNotification
              ? "opacity-0 -translate-x-full pointer-events-none"
              : isAnimating
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full pointer-events-none"
          }
        `}
      >
        {currentNotification && (
          <>
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            {currentNotification}
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentNotificationOverlay;
