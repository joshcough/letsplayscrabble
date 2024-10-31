import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

const AdminInterface = () => {
  const [divisions, setDivisions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState({ player1: '', player2: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDivisions();
  }, []);

  useEffect(() => {
    if (selectedDivision) {
      fetchPlayers(selectedDivision);
    } else {
      setPlayers([]);
    }
  }, [selectedDivision]);

  const fetchDivisions = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching divisions...');
      const response = await fetch(`${API_BASE}/api/divisions`);
      const data = await response.json();
      console.log('Divisions received:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch divisions');
      }

      setDivisions(data);
    } catch (err) {
      console.error('Error fetching divisions:', err);
      setError('Failed to fetch divisions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayers = async (divisionId) => {
    setIsLoading(true);
    try {
      console.log('Fetching players for division:', divisionId);
      const response = await fetch(`${API_BASE}/api/players/${divisionId}`);
      const data = await response.json();
      console.log('Players received:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch players');
      }

      setPlayers(data);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to fetch players. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentMatch = async () => {
    if (!selectedPlayers.player1 || !selectedPlayers.player2) {
      setError('Please select both players');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending match update:', {
        player1Id: selectedPlayers.player1,
        player2Id: selectedPlayers.player2,
        divisionId: selectedDivision
      });

      const response = await fetch(`${API_BASE}/api/match/current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: selectedPlayers.player1,
          player2Id: selectedPlayers.player2,
          divisionId: selectedDivision
        })
      });

      const data = await response.json();
      console.log('Match update response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update match');
      }

      setError(null);
      setSuccess('Match updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating match:', err);
      setError(err.message || 'Failed to update match');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Tournament Admin Panel</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full border rounded-md p-2"
              disabled={isLoading}
            >
              <option value="">Select Division</option>
              {divisions.map(div => (
                <option key={div.id} value={div.id}>{div.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Player 1</label>
              <select
                value={selectedPlayers.player1}
                onChange={(e) => setSelectedPlayers(prev => ({ ...prev, player1: e.target.value }))}
                className="w-full border rounded-md p-2"
                disabled={!selectedDivision || isLoading}
              >
                <option value="">Select Player</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Player 2</label>
              <select
                value={selectedPlayers.player2}
                onChange={(e) => setSelectedPlayers(prev => ({ ...prev, player2: e.target.value }))}
                className="w-full border rounded-md p-2"
                disabled={!selectedDivision || isLoading}
              >
                <option value="">Select Player</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={updateCurrentMatch}
            disabled={isLoading || !selectedPlayers.player1 || !selectedPlayers.player2}
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              isLoading || !selectedPlayers.player1 || !selectedPlayers.player2
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isLoading ? 'Updating...' : 'Update Match'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;