import React, { useState } from 'react';
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

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-blue-800">Instructions:</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li><strong>Match your overlay settings:</strong> Set User ID (2), Tournament ID (65), Division ID (146)</li>
            <li>Enter a player name for the notifications</li>
            <li>Configure the high score values or winning streak length</li>
            <li>Click the buttons to send test notifications</li>
            <li>Check your GameBoardOverlay to see them appear</li>
            <li><strong>Text inputs:</strong> No more annoying number input behavior!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;