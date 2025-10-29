import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/interfaces';

interface TournamentFile {
  value: string;
  label: string;
}

const TournamentTesterPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const [availableFiles, setAvailableFiles] = useState<TournamentFile[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [devTournamentId, setDevTournamentId] = useState<number | null>(() => {
    const saved = localStorage.getItem('devTournamentId');
    return saved ? parseInt(saved, 10) : null;
  });

  // Set page title
  useEffect(() => {
    document.title = "Dev Tournament Tester - Scrabble Stats";
  }, []);

  // Save devTournamentId to localStorage when it changes
  useEffect(() => {
    if (devTournamentId !== null) {
      localStorage.setItem('devTournamentId', devTournamentId.toString());
    }
  }, [devTournamentId]);

  // Load available files and current file on mount
  useEffect(() => {
    loadAvailableFiles();
    loadCurrentFile();
    checkForExistingDevTournament();
  }, []);

  const checkForExistingDevTournament = async () => {
    try {
      const response = await apiService.listTournaments();
      if (response.success && response.data) {
        // Look for existing dev tournament by dataUrl
        const existingDevTournament = response.data.find(
          t => t.dataUrl === 'http://localhost:3001/api/dev/tourney.js'
        );
        if (existingDevTournament) {
          setDevTournamentId(existingDevTournament.id);
          console.log('Found existing dev tournament:', existingDevTournament.id);
        }
      }
    } catch (error) {
      console.error('Failed to check for existing dev tournament:', error);
    }
  };

  const loadAvailableFiles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dev/available-files');
      const data = await response.json();
      if (data.success) {
        setAvailableFiles(data.data);
        if (data.data.length > 0 && !selectedFile) {
          setSelectedFile(data.data[0].value);
        }
      }
    } catch (error) {
      console.error('Failed to load available files:', error);
    }
  };

  const loadCurrentFile = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dev/current-file');
      const data = await response.json();
      if (data.success) {
        setCurrentFile(data.data.file);
      }
    } catch (error) {
      console.error('Failed to load current file:', error);
    }
  };

  const handleSetTournament = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/dev/set-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: selectedFile }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentFile(data.data.file);
        setMessage({ type: 'success', text: `Tournament updated to: ${selectedFile}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update tournament' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update tournament' });
      console.error('Failed to set tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevTournament = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Delete existing dev tournament if it exists
      if (devTournamentId) {
        console.log('Deleting existing dev tournament:', devTournamentId);
        await apiService.deleteTournament(devTournamentId);
      }

      // Create tournament with dataUrl pointing to dev endpoint
      const tournamentData = {
        name: 'Dev Test Tournament',
        city: 'Development',
        year: new Date().getFullYear(),
        lexicon: 'TWL',
        longFormName: 'Dev Test Tournament - Memory Testing',
        dataUrl: 'http://localhost:3001/api/dev/tourney.js',
        enablePolling: true,
      };

      const response = await apiService.createTournament(tournamentData);

      if (response.success && response.data) {
        setDevTournamentId(response.data.id);
        setMessage({
          type: 'success',
          text: `Dev tournament created! ID: ${response.data.id}. Polling is enabled.`
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to create tournament' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create tournament' });
      console.error('Failed to create dev tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTournament = async () => {
    if (!devTournamentId) return;

    setLoading(true);
    setMessage(null);

    try {
      // Step 1: Delete all games from database for this tournament
      console.log('Deleting all games for tournament:', devTournamentId);
      const clearGamesResponse = await fetch('http://localhost:3001/api/dev/clear-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: devTournamentId }),
      });

      const clearGamesData = await clearGamesResponse.json();

      if (!clearGamesData.success) {
        setMessage({ type: 'error', text: 'Failed to clear games from database' });
        return;
      }

      console.log(`Deleted ${clearGamesData.data.deletedCount} games`);

      // Step 2: Change backend file to initial state
      const fileResponse = await fetch('http://localhost:3001/api/dev/set-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'tournament_00_initial.js' }),
      });

      const fileData = await fileResponse.json();

      if (!fileData.success) {
        setMessage({ type: 'error', text: 'Failed to reset tournament file' });
        return;
      }

      setCurrentFile(fileData.data.file);

      // Step 3: Immediately set to round 1 pairings so next polling cycle picks it up
      const pairingsResponse = await fetch('http://localhost:3001/api/dev/set-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'tournament_01_round1_pairings.js' }),
      });

      const pairingsData = await pairingsResponse.json();

      if (pairingsData.success) {
        setCurrentFile(pairingsData.data.file);
        setSelectedFile('tournament_01_round1_pairings.js');
        console.log('Set to round 1 pairings');
      }

      // Step 4: Clear cache so polling refreshes with pairings
      console.log('Clearing cache...');
      await apiService.clearTournamentCache();

      setMessage({
        type: 'success',
        text: `Tournament reset! Deleted ${clearGamesData.data.deletedCount} games. Set to Round 1 pairings. Polling will update in ~10s.`
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset tournament' });
      console.error('Failed to reset tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Tournament Memory Tester</h1>
          <p className="text-amber-700 mb-8">
            Create a dev tournament and step through rounds to monitor memory usage in overlays
          </p>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Create Dev Tournament */}
          <div className="mb-8 p-6 bg-amber-50 rounded-lg border-2 border-amber-200">
            <h2 className="text-2xl font-bold text-amber-900 mb-4">Step 1: Create Dev Tournament</h2>
            <p className="text-amber-700 mb-4">
              Creates a new tournament pointing to <code className="bg-amber-200 px-2 py-1 rounded">http://localhost:3001/api/dev/tourney.js</code>
              <br />
              {devTournamentId && (
                <span className="text-sm font-semibold text-amber-900">Dev tournament already exists (ID: {devTournamentId}). Click to recreate.</span>
              )}
              {!devTournamentId && (
                <span className="text-sm">No dev tournament exists. Create one to begin testing.</span>
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCreateDevTournament}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : devTournamentId ? 'Recreate Dev Tournament' : 'Create Dev Tournament'}
              </button>
              <button
                onClick={handleResetTournament}
                disabled={loading || !devTournamentId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset to Initial State'}
              </button>
            </div>
            {devTournamentId && (
              <div className="mt-4 p-4 bg-white rounded border border-amber-300">
                <p className="font-semibold text-amber-900">Dev Tournament ID: {devTournamentId}</p>
                <p className="text-sm text-amber-700 mt-2">
                  Open overlay: <a href={`/users/1/overlay/standings`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Standings Overlay</a>
                </p>
                <p className="text-sm text-amber-700">
                  Open vanilla overlay: <a href={`/overlays/standings/index.html?userId=1`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Vanilla Standings</a>
                </p>
              </div>
            )}
          </div>

          {/* Select Tournament Stage */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Step 2: Update Tournament Stage</h2>
            <p className="text-blue-700 mb-4">
              Currently serving: <strong>{currentFile || 'Loading...'}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-900 font-semibold mb-2">
                  Select Tournament Stage:
                </label>
                <select
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {availableFiles.map((file) => (
                    <option key={file.value} value={file.value}>
                      {file.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSetTournament}
                disabled={loading || !selectedFile}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Updating...' : 'Update Tournament Stage'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Test Memory</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Create a new dev tournament (above)</li>
              <li>Open the overlay in a new tab (links appear after creating tournament)</li>
              <li>Open Chrome Task Manager (<kbd>Shift+Esc</kbd>)</li>
              <li>Note the memory usage for the overlay tab</li>
              <li>Update to the next tournament stage using the dropdown</li>
              <li>Wait ~10 seconds for polling to detect changes</li>
              <li>Check memory usage again</li>
              <li>Repeat through all stages to monitor memory growth</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentTesterPage;
