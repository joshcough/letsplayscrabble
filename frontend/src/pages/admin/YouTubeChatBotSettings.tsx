import React, { useState, useEffect } from 'react';
import { YouTubeChatBot, YouTubeChatConfig } from '../../services/YouTubeChatBot';

const YouTubeChatBotSettings: React.FC = () => {
  const [config, setConfig] = useState<YouTubeChatConfig>({
    enabled: false,
    channelId: '',
    accessToken: '',
    liveChatId: ''
  });
  const [status, setStatus] = useState<any>({});
  const [testMessage, setTestMessage] = useState('🎯 Test message from LPS Advanced Stats!');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('youtubeChatBotConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      YouTubeChatBot.getInstance().configure(parsed);
    }
    
    // Get current status
    setStatus(YouTubeChatBot.getInstance().getStatus());
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('youtubeChatBotConfig', JSON.stringify(config));
      
      // Configure the bot
      YouTubeChatBot.getInstance().configure(config);
      
      // Update status
      setStatus(YouTubeChatBot.getInstance().getStatus());
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    setIsTesting(true);
    try {
      const testNotification = {
        id: `test-${Date.now()}`,
        type: 'high_score' as const,
        timestamp: Date.now(),
        tournamentId: 1,
        divisionId: 1,
        userId: 1,
        playerName: 'Test Player',
        score: 500
      };
      
      await YouTubeChatBot.getInstance().sendNotificationToChat(testNotification);
      alert('Test message sent successfully!');
    } catch (error) {
      console.error('Failed to send test message:', error);
      alert(`Failed to send test message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">YouTube Chat Bot Settings</h1>
      
      {/* Status Display */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Current Status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Enabled: <span className={status.enabled ? 'text-green-600' : 'text-red-600'}>{status.enabled ? 'Yes' : 'No'}</span></div>
          <div>Authenticated: <span className={status.authenticated ? 'text-green-600' : 'text-red-600'}>{status.authenticated ? 'Yes' : 'No'}</span></div>
          <div>Has Channel ID: <span className={status.hasChannelId ? 'text-green-600' : 'text-red-600'}>{status.hasChannelId ? 'Yes' : 'No'}</span></div>
          <div>Has Live Chat ID: <span className={status.hasLiveChatId ? 'text-green-600' : 'text-red-600'}>{status.hasLiveChatId ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({...config, enabled: e.target.checked})}
              className="mr-2"
            />
            Enable YouTube Chat Bot
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            YouTube Channel ID
          </label>
          <input
            type="text"
            value={config.channelId || ''}
            onChange={(e) => setConfig({...config, channelId: e.target.value})}
            placeholder="UCxxxxxxxxxxxxxxxxxxxxx"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your YouTube channel ID (found in YouTube Studio → Settings → Channel)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Live Chat ID
          </label>
          <input
            type="text"
            value={config.liveChatId || ''}
            onChange={(e) => setConfig({...config, liveChatId: e.target.value})}
            placeholder="Cg0KCxxxxxxxxxxx"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Live chat ID for your current stream (get from YouTube Live Chat API)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Access Token
          </label>
          <input
            type="password"
            value={config.accessToken || ''}
            onChange={(e) => setConfig({...config, accessToken: e.target.value})}
            placeholder="ya29.xxxxxxxxxxxxxxxxxxxxx"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            OAuth 2.0 access token with YouTube scope (expires periodically)
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Test Section */}
      <div className="mt-8 pt-6 border-t border-gray-300">
        <h2 className="text-lg font-semibold mb-3">Test Message</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Test message to send to chat"
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={handleTestMessage}
            disabled={isTesting || !status.authenticated}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isTesting ? 'Sending...' : 'Send Test'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Bot must be enabled and authenticated to send test messages
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Create a project in Google Cloud Console</li>
          <li>Enable the YouTube Data API v3</li>
          <li>Create OAuth 2.0 credentials</li>
          <li>Get an access token with 'https://www.googleapis.com/auth/youtube' scope</li>
          <li>Start a live stream and get the live chat ID from the API</li>
          <li>Fill in the form above and save</li>
        </ol>
      </div>
    </div>
  );
};

export default YouTubeChatBotSettings;