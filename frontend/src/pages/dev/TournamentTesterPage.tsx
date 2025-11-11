import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/interfaces';

interface TournamentVersion {
  id: number;
  tournament_id: number;
  created_at: string;
}

const TournamentTesterPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tournamentId, setTournamentId] = useState<number | null>(() => {
    const saved = localStorage.getItem('devTournamentId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [versions, setVersions] = useState<TournamentVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = "LPS: Dev Tournament Tester";
  }, []);

  // Save tournamentId to localStorage when it changes
  useEffect(() => {
    if (tournamentId !== null) {
      localStorage.setItem('devTournamentId', tournamentId.toString());
    }
  }, [tournamentId]);

  // Load versions when tournament changes
  useEffect(() => {
    if (tournamentId) {
      loadVersions();
    }
  }, [tournamentId]);

  const loadVersions = async () => {
    if (!tournamentId) return;

    try {
      // Query versions for this tournament from backend
      const response = await fetch(`http://localhost:3001/api/private/tournaments/${tournamentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setVersions(data.data);
          setIsSetupComplete(data.data.length > 0);
        }
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleCreateTournament = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Delete existing dev tournament if it exists
      if (tournamentId) {
        console.log('Deleting existing dev tournament:', tournamentId);
        await apiService.deleteTournament(tournamentId);
      }

      // Create tournament with dataUrl pointing to dev endpoint
      const tournamentData = {
        name: 'Dev Test Tournament',
        city: 'Development',
        year: new Date().getFullYear(),
        lexicon: 'TWL',
        longFormName: 'Dev Test Tournament - Database Simulation',
        dataUrl: 'http://localhost:3001/api/dev/tourney.js',
        enablePolling: false, // Start with polling disabled
      };

      const response = await apiService.createTournament(tournamentData);

      if (response.success && response.data) {
        setTournamentId(response.data.id);
        setIsSetupComplete(false);
        setVersions([]);
        setMessage({
          type: 'success',
          text: `Tournament created! ID: ${response.data.id}. Click "Setup Simulation" to load progression files.`
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

  const handleSetupSimulation = async () => {
    if (!tournamentId) return;

    setLoading(true);
    setMessage(null);

    try {
      // Load all progression files into database
      const response = await fetch('http://localhost:3001/api/dev/load-progression-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Loaded ${data.data.count} progression files! Ready to simulate.`
        });
        await loadVersions(); // Reload versions
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load progression files' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load progression files' });
      console.error('Failed to setup simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    if (!tournamentId || versions.length === 0) return;

    setLoading(true);
    setMessage(null);

    try {
      // Start simulation - this sets data_url, save_versions=false, enables polling
      const response = await fetch('http://localhost:3001/api/dev/start-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });

      const data = await response.json();

      if (data.success) {
        // Set to first version
        await setVersion(0);
        setIsSimulating(true);
        setMessage({
          type: 'success',
          text: 'Simulation started! Advancing every 10 seconds...'
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start simulation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start simulation' });
      console.error('Failed to start simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopSimulation = async () => {
    if (!tournamentId) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/dev/stop-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSimulating(false);
        setMessage({
          type: 'success',
          text: 'Simulation stopped!'
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to stop simulation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to stop simulation' });
      console.error('Failed to stop simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const setVersion = async (index: number) => {
    if (index < 0 || index >= versions.length) return;

    const version = versions[index];

    try {
      const response = await fetch('http://localhost:3001/api/dev/set-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentVersionIndex(index);
        console.log(`Set to version ${index + 1}/${versions.length} (ID: ${version.id})`);
      }
    } catch (error) {
      console.error('Failed to set version:', error);
    }
  };

  const handleNext = async () => {
    const nextIndex = currentVersionIndex + 1;
    if (nextIndex >= versions.length) {
      setMessage({ type: 'error', text: 'Already at last version' });
      setIsSimulating(false);
      return;
    }
    await setVersion(nextIndex);
  };

  const handlePrevious = async () => {
    const prevIndex = currentVersionIndex - 1;
    if (prevIndex < 0) {
      setMessage({ type: 'error', text: 'Already at first version' });
      return;
    }
    await setVersion(prevIndex);
  };

  // Auto-advance simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      handleNext();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isSimulating, currentVersionIndex, versions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-4">Tournament Simulator (Database-Driven)</h1>

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

          {/* Step 1: Create Tournament */}
          <div className="mb-4 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
            <h2 className="text-xl font-bold text-amber-900 mb-3">Step 1: Create Tournament</h2>
            <button
              onClick={handleCreateTournament}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : tournamentId ? 'Recreate' : 'Create'}
            </button>
            {tournamentId && (
              <div className="mt-3 p-3 bg-white rounded border border-amber-300">
                <p className="text-sm text-amber-900">
                  <strong>ID: {tournamentId}</strong> • <a href={`/users/1/overlay/standings`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Overlay</a>
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Setup Simulation */}
          {tournamentId && !isSetupComplete && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-3">Step 2: Load Progression Files</h2>
              <button
                onClick={handleSetupSimulation}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Setup Simulation (Load 61 Files)'}
              </button>
            </div>
          )}

          {/* Step 3: Run Simulation */}
          {tournamentId && isSetupComplete && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h2 className="text-xl font-bold text-green-900 mb-3">Step 3: Simulate</h2>
              <p className="text-sm text-green-700 mb-3">
                Version: <strong>{currentVersionIndex + 1} / {versions.length}</strong>
              </p>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={handlePrevious}
                  disabled={loading || isSimulating || currentVersionIndex === 0}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={loading || isSimulating || currentVersionIndex >= versions.length - 1}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex-grow"
                >
                  Next →
                </button>
              </div>

              <button
                onClick={isSimulating ? handleStopSimulation : handleStartSimulation}
                disabled={loading}
                className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${
                  isSimulating
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isSimulating ? '⏸ Stop Simulation' : '▶ Run Simulation (10s intervals)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentTesterPage;
