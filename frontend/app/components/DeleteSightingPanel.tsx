'use client';

import { useState, useEffect } from 'react';
import { Sighting } from '../types';

interface DeleteSightingPanelProps {
  onClose: () => void;
  currentUser: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function DeleteSightingPanel({ onClose, currentUser }: DeleteSightingPanelProps) {
  const [userSightings, setUserSightings] = useState<Sighting[]>([]);
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch user's sightings from backend
  const fetchUserSightings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/sightings/user/${currentUser}`);
      const data = await response.json();
      if (response.ok) {
        setUserSightings(data);
      } else {
        setError(data.message || 'Failed to fetch sightings');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSightings();
  }, [currentUser]);

  const handleDelete = async () => {
    if (!selectedSighting) return;
    
    const sightingId = selectedSighting.sightingId || selectedSighting.id;
    if (!sightingId) {
      setError('No sighting ID found');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/sightings/${sightingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser }),
      });

      const data = await response.json();
      if (response.ok) {
        setUserSightings(userSightings.filter(s => (s.sightingId || s.id) !== sightingId));
        setShowConfirmation(false);
        setSelectedSighting(null);
      } else {
        setError(data.message || 'Failed to delete sighting');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (sighting: Sighting) => {
    setSelectedSighting(sighting);
    setShowConfirmation(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[600px] max-h-[80vh] shadow-2xl flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Manage My Sightings</h2>
        <p className="text-gray-400 text-sm mb-4">
          View and delete your submitted Pokémon sightings
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Sightings List */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : userSightings.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📭</div>
              <p>You haven't submitted any sightings yet.</p>
            </div>
          ) : (
            userSightings.map((sighting) => (
              <div
                key={sighting.sightingId || sighting.id}
                className="bg-gray-700 rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-1">
                    {sighting.pokemonName || sighting.pokemon_name}
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      📍 {Number(sighting.latitude).toFixed(4)}, {Number(sighting.longitude).toFixed(4)}
                    </div>
                    <div>🕐 {new Date(sighting.timestamp || sighting.reportTime || new Date()).toLocaleString()}</div>
                    <div>🌤️ {sighting.weather}</div>
                  </div>
                </div>
                <button
                  onClick={() => confirmDelete(sighting)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors ml-4"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedSighting && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg p-6 w-96 shadow-2xl border-2 border-red-500">
            <h3 className="text-xl font-bold mb-4 text-red-500">⚠️ Confirm Deletion</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this sighting?
            </p>
            <div className="bg-gray-700 rounded-lg p-3 mb-4 text-sm">
              <div className="font-semibold">{selectedSighting.pokemonName || selectedSighting.pokemon_name}</div>
              <div className="text-gray-400">
                {new Date(selectedSighting.timestamp || selectedSighting.reportTime || new Date()).toLocaleString()}
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              This action cannot be undone. The sighting will be permanently removed from the database.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedSighting(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
