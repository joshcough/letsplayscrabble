// Types for the notification system

export interface BaseNotification {
  id: string;
  timestamp: number;
  tournamentId: number;
  divisionId: number;
  userId: number;
}

export interface HighScoreNotification extends BaseNotification {
  type: 'high_score';
  playerName: string;
  score: number;
  previousHighScore?: number;
  playerPhoto?: string;
}

export interface WinningStreakNotification extends BaseNotification {
  type: 'winning_streak';
  playerName: string;
  streakLength: number;
  playerPhoto?: string;
}

// Union type for all notification types
export type NotificationData = HighScoreNotification | WinningStreakNotification;

// Broadcast message for notifications
export interface NotificationBroadcastMessage {
  type: 'NOTIFICATION';
  data: NotificationData;
}