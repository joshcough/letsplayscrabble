import React, { useState, useEffect } from 'react';
import { NotificationManager } from '../services/NotificationManager';
import { NotificationData } from '../types/notifications';

const NotificationTestPage: React.FC = () => {
  const [userId, setUserId] = useState('2');
  const [tournamentId, setTournamentId] = useState('65');
  const [divisionId, setDivisionId] = useState('146');
  const [playerName, setPlayerName] = useState('Nigel Richards');
  const [playerPhoto, setPlayerPhoto] = useState('https://tinyurl.com/5c2h7s75');
  const [highScore, setHighScore] = useState(500);
  const [previousHighScore, setPreviousHighScore] = useState(400);
  const [streakLength, setStreakLength] = useState(18);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const updateQueueStatus = () => {
      const status = NotificationManager.getInstance().getQueueStatus();
      setQueueStatus(status);
      setQueueItems(NotificationManager.getInstance().getQueue());

      // Calculate countdown for currently displaying notification
      if (status?.currentNotification?.status === 'displaying') {
        const startTime = status.currentNotification.displayStartTime || Date.now();
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 15000 - elapsed); // 15 seconds display time
        setCountdown(Math.ceil(remaining / 1000));
      } else {
        setCountdown(null);
      }
    };

    // Update initially
    updateQueueStatus();

    // Update every 500ms to show real-time status
    const interval = setInterval(updateQueueStatus, 500);

    return () => clearInterval(interval);
  }, []);

  const sendHighScoreNotification = () => {
    const notification: NotificationData = {
      id: `test-high-score-${Date.now()}`,
      type: 'high_score',
      timestamp: Date.now(),
      tournamentId: parseInt(tournamentId),
      divisionId: parseInt(divisionId),
      userId: parseInt(userId),
      playerName,
      playerPhoto: playerPhoto || undefined,
      score: highScore,
      previousHighScore
    };

    NotificationManager.getInstance().sendNotification(notification);
    console.log('🏆 Sent high score notification:', notification);
  };

  const sendWinningStreakNotification = () => {
    const notification: NotificationData = {
      id: `test-streak-${Date.now()}`,
      type: 'winning_streak',
      timestamp: Date.now(),
      tournamentId: parseInt(tournamentId),
      divisionId: parseInt(divisionId),
      userId: parseInt(userId),
      playerName,
      playerPhoto: playerPhoto || undefined,
      streakLength
    };

    NotificationManager.getInstance().sendNotification(notification);
    console.log('🔥 Sent winning streak notification:', notification);
  };

  const pauseQueue = () => {
    NotificationManager.getInstance().pauseQueue();
  };

  const resumeQueue = () => {
    NotificationManager.getInstance().resumeQueue();
  };

  const clearQueue = () => {
    NotificationManager.getInstance().clearQueue();
  };

  const cancelCurrent = () => {
    NotificationManager.getInstance().cancelCurrentNotification();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notification Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tournament ID</label>
              <input
                type="text"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="65"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Division ID</label>
              <input
                type="text"
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="146"
              />
              <p className="text-xs text-gray-500 mt-1">Use the numeric division ID from your overlay URL</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Player Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Player Photo URL</label>
              <input
                type="text"
                value={playerPhoto}
                onChange={(e) => setPlayerPhoto(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://via.placeholder.com/150"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank for no image, or use a URL to a player photo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* High Score Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">🏆 High Score Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New High Score</label>
                <input
                  type="number"
                  value={highScore}
                  onChange={(e) => setHighScore(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Previous High Score</label>
                <input
                  type="number"
                  value={previousHighScore}
                  onChange={(e) => setPreviousHighScore(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={sendHighScoreNotification}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Send High Score Notification
              </button>
            </div>
          </div>

          {/* Winning Streak Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">🔥 Winning Streak Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Streak Length</label>
                <input
                  type="number"
                  min="3"
                  value={streakLength}
                  onChange={(e) => setStreakLength(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={sendWinningStreakNotification}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Send Winning Streak Notification
              </button>
            </div>
          </div>
        </div>

        {/* Queue Status and Controls */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-purple-800 mb-4">📋 Notification Queue Status</h3>
          
          {queueStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{queueStatus.pendingCount}</div>
                <div className="text-sm text-purple-700">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{queueStatus.totalInQueue}</div>
                <div className="text-sm text-purple-700">Total in Queue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{queueStatus.historyCount}</div>
                <div className="text-sm text-purple-700">History</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${queueStatus.isProcessing ? 'text-green-600' : 'text-red-600'}`}>
                  {queueStatus.isProcessing ? '▶️' : '⏸️'}
                </div>
                <div className="text-sm text-purple-700">
                  {queueStatus.isProcessing ? 'Processing' : 'Paused'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-purple-600">Loading queue status...</div>
          )}

          {queueStatus?.currentNotification && (
            <div className="bg-white rounded p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Currently Displaying:</div>
                  <div className="font-medium">
                    {queueStatus.currentNotification.notification.type === 'high_score' ? 
                      `🏆 High Score: ${queueStatus.currentNotification.notification.playerName} - ${queueStatus.currentNotification.notification.score}` :
                      `🔥 Winning Streak: ${queueStatus.currentNotification.notification.playerName} - ${queueStatus.currentNotification.notification.streakLength} wins`
                    }
                  </div>
                  <div className="text-xs text-gray-500">Priority: {queueStatus.currentNotification.priority}</div>
                </div>
                <div className="flex items-center gap-3">
                  {countdown !== null && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{countdown}s</div>
                      <div className="text-xs text-gray-500">remaining</div>
                    </div>
                  )}
                  <button
                    onClick={cancelCurrent}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-medium"
                    title="Cancel current notification"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={queueStatus?.isProcessing ? pauseQueue : resumeQueue}
              className={`px-4 py-2 rounded text-white font-medium ${
                queueStatus?.isProcessing 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {queueStatus?.isProcessing ? '⏸️ Pause Queue' : '▶️ Resume Queue'}
            </button>
            <button
              onClick={clearQueue}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded"
            >
              🗑️ Clear Queue
            </button>
          </div>

          {/* Detailed Queue View */}
          {queueItems.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-purple-800 mb-2">Queue Details:</h4>
              <div className="bg-white rounded border max-h-64 overflow-y-auto">
                {queueItems
                  .filter(item => item.status === 'pending')
                  .sort((a, b) => b.priority - a.priority || a.queuedAt - b.queuedAt)
                  .map((item, index) => (
                    <div key={item.id} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className="text-sm">
                            {item.notification.type === 'high_score' ? 
                              `🏆 ${item.notification.playerName} - ${item.notification.score}` :
                              `🔥 ${item.notification.playerName} - ${item.notification.streakLength} wins`
                            }
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Priority: {item.priority} • Queued: {new Date(item.queuedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority >= 8 ? 'bg-red-100 text-red-800' :
                          item.priority >= 7 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          P{item.priority}
                        </span>
                        <button
                          onClick={() => NotificationManager.getInstance().cancelNotification(item.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-blue-800">Instructions:</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li><strong>Match your overlay settings:</strong> Set User ID (2), Tournament ID (65), Division ID (146)</li>
            <li><strong>Test the queue:</strong> Click multiple notification buttons rapidly to see queue in action</li>
            <li>Configure the high score values or winning streak length</li>
            <li>Use queue controls to pause/resume or clear pending notifications</li>
            <li>Check your GameBoardOverlay to see them appear one at a time (15s each + 2s delay)</li>
            <li><strong>Priority system:</strong> High scores (8), winning streaks (7), manual (5)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;