import BroadcastManager from '../hooks/BroadcastManager';
import { TournamentDataIncremental } from '../types/broadcast';
import { NotificationData, NotificationBroadcastMessage } from '../types/notifications';
import { highScoreDetector } from '../pages/notifications/HighScore';
import { winningStreakDetector } from '../pages/notifications/WinningStreak';

export class NotificationManager {
  private static instance: NotificationManager;
  private broadcastChannel: BroadcastChannel;
  private cleanupTournamentListener?: () => void;
  
  // All available notification detectors
  private detectors = [highScoreDetector, winningStreakDetector];

  private constructor() {
    this.broadcastChannel = new BroadcastChannel('tournament-updates');
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public start() {
    console.log('🔔 NotificationManager: Starting notification detection system');
    
    // Listen for tournament data updates
    this.cleanupTournamentListener = BroadcastManager.getInstance().onTournamentDataIncremental(
      (data: TournamentDataIncremental) => {
        this.processTournamentUpdate(data);
      }
    );
  }

  public stop() {
    console.log('🔔 NotificationManager: Stopping notification detection system');
    if (this.cleanupTournamentListener) {
      this.cleanupTournamentListener();
      this.cleanupTournamentListener = undefined;
    }
  }

  private processTournamentUpdate(data: TournamentDataIncremental) {
    if (!data.previousData || !data.data) return;

    console.log('🔔 NotificationManager: Processing tournament update for notifications', {
      tournamentId: data.tournamentId,
      userId: data.userId,
      affectedDivisions: data.affectedDivisions
    });

    // Check each affected division for notifications
    for (const divisionId of data.affectedDivisions) {
      const divisionData = data.data.divisions.find(d => d.id === divisionId);
      if (!divisionData) continue;

      // Run each detector
      for (const detector of this.detectors) {
        try {
          const notificationElement = detector(data, divisionData);
          if (notificationElement) {
            // Convert the React element to our notification data format
            const notification = this.extractNotificationData(
              notificationElement, 
              data.tournamentId, 
              divisionId, 
              data.userId
            );
            
            if (notification) {
              this.broadcastNotification(notification);
            }
            break; // Only one notification per division update
          }
        } catch (error) {
          console.error('🔔 NotificationManager: Error running detector:', error);
        }
      }
    }
  }

  private extractNotificationData(
    element: JSX.Element, 
    tournamentId: number, 
    divisionId: number, 
    userId: number
  ): NotificationData | null {
    // This is a bit hacky - we need to extract data from the React element
    // The detectors return JSX elements, but we need structured data
    // For now, let's examine the element props to determine the type and extract data
    
    const props = element.props;
    const type = element.type;
    
    // Generate a unique ID for this notification
    const id = `${tournamentId}-${divisionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to determine notification type and extract relevant data
    if (typeof type === 'function' && type.name?.includes('HighScore')) {
      // High score notification
      return {
        id,
        type: 'high_score',
        timestamp: Date.now(),
        tournamentId,
        divisionId,
        userId,
        playerName: props.playerName || 'Unknown Player',
        score: props.score || 0,
        previousHighScore: props.previousHighScore,
        playerPhoto: props.playerPhoto
      };
    } else if (typeof type === 'function' && type.name?.includes('WinningStreak')) {
      // Winning streak notification
      return {
        id,
        type: 'winning_streak',
        timestamp: Date.now(),
        tournamentId,
        divisionId,
        userId,
        playerName: props.playerName || 'Unknown Player',
        streakLength: props.streakLength || 0,
        playerPhoto: props.playerPhoto
      };
    }

    console.warn('🔔 NotificationManager: Could not extract notification data from element', element);
    return null;
  }

  private broadcastNotification(notification: NotificationData) {
    console.log('🔔 NotificationManager: Broadcasting notification:', notification);
    
    const message: NotificationBroadcastMessage = {
      type: 'NOTIFICATION',
      data: notification
    };

    this.broadcastChannel.postMessage(message);
  }

  // Method for manually sending notifications (used by test page)
  public sendNotification(notification: NotificationData) {
    this.broadcastNotification(notification);
  }

  public destroy() {
    this.stop();
    this.broadcastChannel.close();
  }
}

// Auto-start the notification manager when the module is loaded
// This ensures it's always running to detect notifications
if (typeof window !== 'undefined') {
  const manager = NotificationManager.getInstance();
  manager.start();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    manager.destroy();
  });
}