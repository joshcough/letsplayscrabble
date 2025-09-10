import { NotificationData } from '../types/notifications';

export interface YouTubeChatConfig {
  enabled: boolean;
  channelId?: string;
  accessToken?: string;
  liveChatId?: string;
}

export class YouTubeChatBot {
  private static instance: YouTubeChatBot;
  private config: YouTubeChatConfig = { enabled: false };
  private isAuthenticated = false;

  private constructor() {}

  public static getInstance(): YouTubeChatBot {
    if (!YouTubeChatBot.instance) {
      YouTubeChatBot.instance = new YouTubeChatBot();
    }
    return YouTubeChatBot.instance;
  }

  public configure(config: YouTubeChatConfig) {
    this.config = { ...config };
    this.isAuthenticated = !!(config.accessToken && config.channelId && config.liveChatId);
    
    console.log('🤖 YouTubeChatBot: Configured', {
      enabled: config.enabled,
      authenticated: this.isAuthenticated,
      hasChannelId: !!config.channelId,
      hasLiveChatId: !!config.liveChatId
    });
  }

  public async sendNotificationToChat(notification: NotificationData): Promise<void> {
    if (!this.config.enabled || !this.isAuthenticated) {
      console.log('🤖 YouTubeChatBot: Skipping chat message - not enabled or authenticated');
      return;
    }

    const message = this.formatNotificationMessage(notification);
    if (!message) {
      console.log('🤖 YouTubeChatBot: No message to send for notification type:', notification.type);
      return;
    }

    try {
      await this.postToYouTubeChat(message);
      console.log('🤖 YouTubeChatBot: Successfully sent message:', message);
    } catch (error) {
      console.error('🤖 YouTubeChatBot: Failed to send message:', error);
      // Don't throw - we don't want to break the notification system if chat fails
    }
  }

  private formatNotificationMessage(notification: NotificationData): string | null {
    switch (notification.type) {
      case 'high_score':
        return `🎯 New high score: ${notification.score} by ${notification.playerName}!`;
        
      case 'winning_streak':
        return `🔥 ${notification.playerName} is on a ${notification.streakLength}-game winning streak!`;
        
      default:
        console.warn('🤖 YouTubeChatBot: Unknown notification type:', (notification as any).type);
        return null;
    }
  }

  private async postToYouTubeChat(message: string): Promise<void> {
    const url = `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet`;
    
    const body = {
      snippet: {
        liveChatId: this.config.liveChatId,
        type: 'textMessageDetails',
        textMessageDetails: {
          messageText: message
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YouTube API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  public isEnabled(): boolean {
    return this.config.enabled && this.isAuthenticated;
  }

  public getStatus() {
    return {
      enabled: this.config.enabled,
      authenticated: this.isAuthenticated,
      hasChannelId: !!this.config.channelId,
      hasLiveChatId: !!this.config.liveChatId,
      hasAccessToken: !!this.config.accessToken
    };
  }
}