'use client';

import { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (username: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(username);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after successful registration
        onLogin(username);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">
          {isRegisterMode ? 'Register for PokéSight' : 'Login to PokéSight'}
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          {isRegisterMode 
            ? 'Create an account to submit and manage sightings'
            : 'Login to submit sightings and manage your reports'
          }
        </p>
        
        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-900 bg-opacity-30 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Please wait...' : (isRegisterMode ? 'Register' : 'Login')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">
            {isRegisterMode ? (
              <>
                Already have an account?{' '}
                <button type="button" onClick={switchMode} className="text-blue-400 hover:underline">
                  Login here
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={switchMode} className="text-blue-400 hover:underline">
                  Register here
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
