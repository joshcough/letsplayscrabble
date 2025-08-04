import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { TournamentDataIncremental } from "@shared/types/broadcast";

import BroadcastManager from "../../hooks/BroadcastManager";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";

type RouteParams = {
  userId: string;
  tournamentId?: string;
  divisionName?: string;
};

// Generic notification event that all specific notifications must implement
export interface NotificationEvent {
  id: string;
  timestamp: number;
  displayDurationMs?: number; // Optional, defaults to 5000
}

// Notification detector function type
export type NotificationDetector<T extends NotificationEvent> = (
  update: TournamentDataIncremental,
  divisionData: any, // Could be typed more specifically
) => T | null;

// Notification component renderer type
export type NotificationRenderer<T extends NotificationEvent> = React.FC<{
  event: T;
  divisionData: any;
  isAnimating: boolean;
}>;

// Combined notification configuration
export interface NotificationConfig<T extends NotificationEvent> {
  detector: NotificationDetector<T>;
  renderer: NotificationRenderer<T>;
  displayDurationMs?: number;
}

// Generic tournament notification overlay component
interface TournamentNotificationOverlayProps<T extends NotificationEvent> {
  notificationConfigs: NotificationConfig<T>[];
}

const TournamentNotificationOverlay = <T extends NotificationEvent>({
  notificationConfigs,
}: TournamentNotificationOverlayProps<T>) => {
  const {
    userId,
    tournamentId: urlTournamentId,
    divisionName,
  } = useParams<RouteParams>();

  // State for current notification
  const [currentNotification, setCurrentNotification] = useState<{
    event: T;
    config: NotificationConfig<T>;
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Data source logic
  const shouldUseCurrentMatch = !urlTournamentId || !divisionName;

  const { currentMatch, loading: currentMatchLoading } = useCurrentMatch();

  const {
    tournamentData: urlTournamentData,
    selectedDivisionId: urlDivisionId,
    loading: urlLoading,
  } = useTournamentData({
    tournamentId: urlTournamentId ? parseInt(urlTournamentId) : undefined,
    useUrlParams: !shouldUseCurrentMatch,
  });

  const {
    tournamentData: currentMatchTournamentData,
    loading: currentMatchTournamentLoading,
  } = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
    useUrlParams: false,
  });

  // Effective data
  const effectiveTournamentData = shouldUseCurrentMatch
    ? currentMatchTournamentData
    : urlTournamentData;
  const effectiveDivisionId = shouldUseCurrentMatch
    ? currentMatch?.division_id
    : urlDivisionId;
  const effectiveLoading = shouldUseCurrentMatch
    ? currentMatchLoading || currentMatchTournamentLoading
    : urlLoading;

  const divisionData = effectiveTournamentData?.divisions.find(
    (d: any) => d.division.id === effectiveDivisionId,
  );

  // Listen for incremental updates
  useEffect(() => {
    if (
      !userId ||
      !effectiveDivisionId ||
      !divisionData ||
      notificationConfigs.length === 0
    ) {
      console.log(
        "🎯 TournamentNotification: Not ready to listen for updates:",
        {
          userId: !!userId,
          effectiveDivisionId,
          divisionDataReady: !!divisionData,
          notificationConfigsLength: notificationConfigs.length,
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

        if (!data.previousData || !data.data) {
          console.log(
            "🎯 TournamentNotification: Missing previous or new data",
          );
          return;
        }

        // Try each notification detector in order until one matches
        for (const config of notificationConfigs) {
          const notificationEvent = config.detector(data, divisionData);
          if (notificationEvent) {
            console.log("🎯 Notification detected:", notificationEvent);

            setCurrentNotification({ event: notificationEvent, config });
            setTimeout(() => setIsAnimating(true), 50);
            break; // Only show one notification at a time
          }
        }
      },
    );

    return cleanup;
  }, [userId, effectiveDivisionId, divisionData, notificationConfigs]);

  // Handle animation timing
  useEffect(() => {
    if (currentNotification && isAnimating) {
      const duration =
        currentNotification.event.displayDurationMs ??
        currentNotification.config.displayDurationMs ??
        5000;

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

  const NotificationComponent = currentNotification.config.renderer;

  console.log(
    "🎬 Rendering notification with event:",
    currentNotification.event,
    "isAnimating:",
    isAnimating,
  );

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
            <NotificationComponent
              event={currentNotification.event}
              divisionData={divisionData}
              isAnimating={isAnimating}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentNotificationOverlay;
