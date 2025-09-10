import BroadcastManager from '../hooks/BroadcastManager';
import { TournamentDataIncremental } from '../types/broadcast';
import { NotificationData, NotificationBroadcastMessage, NotificationCancelMessage } from '../types/notifications';
import { highScoreDetector } from '../pages/notifications/HighScore';
import { winningStreakDetector } from '../pages/notifications/WinningStreak';
import { YouTubeChatBot } from './YouTubeChatBot';

// Queue item with priority and status
interface QueuedNotification {
  id: string;
  notification: NotificationData;
  priority: number; // 1-10, higher = more important
  status: 'pending' | 'displaying' | 'completed' | 'cancelled';
  queuedAt: number;
  scheduledAt?: number;
  displayStartTime?: number;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private broadcastChannel: BroadcastChannel;
  private cleanupTournamentListener?: () => void;
  
  // All available notification detectors
  private detectors = [highScoreDetector, winningStreakDetector];
  
  // Queue management
  private queue: QueuedNotification[] = [];
  private currentNotification: QueuedNotification | null = null;
  private isProcessing = true;
  private processingTimer?: NodeJS.Timeout;
  private notificationHistory: QueuedNotification[] = []; // Keep last 100
  private readonly HISTORY_LIMIT = 100;
  private readonly DEFAULT_DISPLAY_DURATION = 15000; // 15 seconds
  private readonly DEFAULT_DELAY_BETWEEN = 2000; // 2 seconds between notifications

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
    
    // Start queue processing
    this.startQueueProcessing();
  }

  public stop() {
    console.log('🔔 NotificationManager: Stopping notification detection system');
    if (this.cleanupTournamentListener) {
      this.cleanupTournamentListener();
      this.cleanupTournamentListener = undefined;
    }
    
    // Stop queue processing
    this.stopQueueProcessing();
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
              this.queueNotification(notification);
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

  private async broadcastNotification(notification: NotificationData) {
    console.log('🔔 NotificationManager: Broadcasting notification:', notification);
    
    const message: NotificationBroadcastMessage = {
      type: 'NOTIFICATION',
      data: notification
    };

    // Send to overlay displays
    this.broadcastChannel.postMessage(message);
    
    // Send to YouTube chat
    try {
      const chatBot = YouTubeChatBot.getInstance();
      await chatBot.sendNotificationToChat(notification);
    } catch (error) {
      console.error('🔔 NotificationManager: Failed to send to YouTube chat:', error);
      // Continue processing - don't let chat failures break notifications
    }
  }

  // Method for manually sending notifications (used by test page)
  public sendNotification(notification: NotificationData) {
    this.queueNotification(notification, 5); // Manual notifications get medium priority
  }

  // Queue Management Methods
  private startQueueProcessing() {
    console.log('📋 NotificationQueue: Starting queue processing');
    this.isProcessing = true;
    this.processNextNotification();
  }

  private stopQueueProcessing() {
    console.log('📋 NotificationQueue: Stopping queue processing');
    this.isProcessing = false;
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = undefined;
    }
  }

  private processNextNotification() {
    if (!this.isProcessing) return;
    
    // If currently displaying, wait
    if (this.currentNotification?.status === 'displaying') {
      return;
    }
    
    // Get next pending notification (highest priority first)
    const nextNotification = this.queue
      .filter(item => item.status === 'pending')
      .sort((a, b) => b.priority - a.priority || a.queuedAt - b.queuedAt)[0];
      
    if (nextNotification) {
      this.displayNotification(nextNotification);
    } else {
      // No notifications pending, check again later
      this.processingTimer = setTimeout(() => {
        this.processNextNotification();
      }, 1000);
    }
  }

  private async displayNotification(queuedNotification: QueuedNotification) {
    console.log('📋 NotificationQueue: Displaying notification', queuedNotification.notification);
    
    // Update status and record start time
    queuedNotification.status = 'displaying';
    queuedNotification.displayStartTime = Date.now();
    this.currentNotification = queuedNotification;
    
    // Broadcast the notification (includes YouTube chat)
    await this.broadcastNotification(queuedNotification.notification);
    
    // Schedule completion
    this.processingTimer = setTimeout(() => {
      this.completeNotification(queuedNotification);
    }, this.DEFAULT_DISPLAY_DURATION);
  }

  private completeNotification(queuedNotification: QueuedNotification) {
    console.log('📋 NotificationQueue: Completing notification', queuedNotification.notification);
    
    // Update status
    queuedNotification.status = 'completed';
    this.currentNotification = null;
    
    // Move to history
    this.addToHistory(queuedNotification);
    
    // Remove from queue
    this.queue = this.queue.filter(item => item.id !== queuedNotification.id);
    
    // Wait a bit before processing next
    this.processingTimer = setTimeout(() => {
      this.processNextNotification();
    }, this.DEFAULT_DELAY_BETWEEN);
  }

  private queueNotification(notification: NotificationData, priority: number = this.getDefaultPriority(notification)) {
    const queuedNotification: QueuedNotification = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notification,
      priority,
      status: 'pending',
      queuedAt: Date.now()
    };
    
    console.log('📋 NotificationQueue: Queueing notification', {
      id: queuedNotification.id,
      type: notification.type,
      priority,
      queueLength: this.queue.length + 1
    });
    
    this.queue.push(queuedNotification);
    
    // Trigger processing if not already processing
    if (!this.processingTimer && this.currentNotification?.status !== 'displaying') {
      this.processNextNotification();
    }
  }

  private getDefaultPriority(notification: NotificationData): number {
    switch (notification.type) {
      case 'high_score': return 8; // High priority
      case 'winning_streak': return 7; // High priority
      default: return 5; // Medium priority
    }
  }

  private addToHistory(queuedNotification: QueuedNotification) {
    this.notificationHistory.unshift(queuedNotification);
    
    // Keep only recent history
    if (this.notificationHistory.length > this.HISTORY_LIMIT) {
      this.notificationHistory = this.notificationHistory.slice(0, this.HISTORY_LIMIT);
    }
  }

  // Public Queue Control Methods
  public pauseQueue() {
    console.log('📋 NotificationQueue: Pausing queue processing');
    this.isProcessing = false;
  }

  public resumeQueue() {
    console.log('📋 NotificationQueue: Resuming queue processing');
    this.isProcessing = true;
    this.processNextNotification();
  }

  public clearQueue() {
    console.log('📋 NotificationQueue: Clearing queue');
    this.queue.forEach(item => {
      if (item.status === 'pending') {
        item.status = 'cancelled';
      }
    });
    this.queue = this.queue.filter(item => item.status === 'displaying');
  }

  public cancelNotification(id: string): boolean {
    const notification = this.queue.find(item => item.id === id);
    if (notification && notification.status === 'pending') {
      notification.status = 'cancelled';
      console.log('📋 NotificationQueue: Cancelled notification', id);
      return true;
    }
    return false;
  }

  public cancelCurrentNotification(): boolean {
    if (this.currentNotification && this.currentNotification.status === 'displaying') {
      console.log('📋 NotificationQueue: Cancelling current notification', this.currentNotification.notification);
      
      // Broadcast cancellation message to overlays
      const cancelMessage: NotificationCancelMessage = {
        type: 'NOTIFICATION_CANCEL',
        notificationId: this.currentNotification.notification.id
      };
      this.broadcastChannel.postMessage(cancelMessage);
      
      // Clear the completion timer
      if (this.processingTimer) {
        clearTimeout(this.processingTimer);
        this.processingTimer = undefined;
      }
      
      // Complete the notification immediately
      this.completeNotification(this.currentNotification);
      
      return true;
    }
    return false;
  }

  public replayNotification(historyId: string) {
    const historicalNotification = this.notificationHistory.find(item => item.id === historyId);
    if (historicalNotification) {
      console.log('📋 NotificationQueue: Replaying notification', historyId);
      // Create a new notification with same data but new ID
      const replayNotification: NotificationData = {
        ...historicalNotification.notification,
        id: `replay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      this.queueNotification(replayNotification, 9); // High priority for replays
    }
  }

  // Public Queue Status Methods
  public getQueueStatus() {
    return {
      isProcessing: this.isProcessing,
      currentNotification: this.currentNotification,
      pendingCount: this.queue.filter(item => item.status === 'pending').length,
      totalInQueue: this.queue.length,
      historyCount: this.notificationHistory.length
    };
  }

  public getQueue() {
    return [...this.queue];
  }

  public getHistory() {
    return [...this.notificationHistory];
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