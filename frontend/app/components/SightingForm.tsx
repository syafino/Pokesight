'use client';

import { useState, useEffect } from 'react';
import { mockPokemon } from '../data/mockPokemon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface SightingFormProps {
  onClose: () => void;
  currentUser: string;
}

export default function SightingForm({ onClose, currentUser }: SightingFormProps) {
  const [formData, setFormData] = useState({
    pokemonName: '',
    pokemonId: '',
    location: '',
    latitude: '',
    longitude: '',
    description: '',
    timestamp: new Date().toISOString().slice(0, 16),
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch weather when coordinates change
  useEffect(() => {
    const fetchWeather = async () => {
      // Handle both dot and comma as decimal separators
      const lat = parseFloat(formData.latitude.replace(',', '.'));
      const lng = parseFloat(formData.longitude.replace(',', '.'));
      
      if (isNaN(lat) || isNaN(lng)) {
        setWeather(null);
        return;
      }

      setWeatherLoading(true);
      setWeatherError('');

      try {
        // Using Open-Meteo API - free, no API key required!
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather');
        }

        const data = await response.json();
        const current = data.current;
        
        // Map weather codes to conditions
        const weatherCodeMap: Record<number, string> = {
          0: 'Clear', 1: 'Clear', 2: 'Clouds', 3: 'Clouds',
          45: 'Fog', 48: 'Fog',
          51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
          61: 'Rain', 63: 'Rain', 65: 'Rain',
          71: 'Snow', 73: 'Snow', 75: 'Snow',
          80: 'Rain', 81: 'Rain', 82: 'Rain',
          95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
        };
        
        const condition = weatherCodeMap[current.weather_code] || 'Clear';
        
        setWeather({
          condition,
          temperature: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          icon: '', // Open-Meteo doesn't provide icons
        });
      } catch (err) {
        setWeatherError('Could not fetch weather data');
        setWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchWeather, 500);
    return () => clearTimeout(timer);
  }, [formData.latitude, formData.longitude]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
        },
        (err) => {
          setError('Could not get your location: ' + err.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/sightings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pokemonId: formData.pokemonId,
          userId: currentUser,
          location: formData.location,
          latitude: parseFloat(formData.latitude.replace(',', '.')),
          longitude: parseFloat(formData.longitude.replace(',', '.')),
          description: formData.description,
          // Weather data will be fetched by backend using lat/lng
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit sighting');
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit sighting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    // For coordinate fields, replace commas with dots (for European locales)
    if (field === 'latitude' || field === 'longitude') {
      value = value.replace(',', '.');
    }
    setFormData({ ...formData, [field]: value });
  };

  const handlePokemonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPokemon = mockPokemon.find(p => p.name === e.target.value);
    setFormData({
      ...formData,
      pokemonName: e.target.value,
      // Use pokedexNumber as the database pokemon_id (not the mock id)
      pokemonId: selectedPokemon?.pokedexNumber.toString() || '',
    });
  };

  const getWeatherEmoji = (condition: string) => {
    const emojis: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
    };
    return emojis[condition] || '🌡️';
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 w-96 shadow-2xl text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Sighting Submitted!</h2>
          <p className="text-gray-400">
            Your Pokémon sighting has been added to the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 w-[500px] shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Submit a Pokémon Sighting</h2>
        <p className="text-gray-400 text-sm mb-4">
          Report a Pokémon you've found to help other trainers!
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pokémon Name *</label>
            <select
              value={formData.pokemonName}
              onChange={handlePokemonChange}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a Pokémon</option>
              {mockPokemon.map((pokemon) => (
                <option key={pokemon.id} value={pokemon.name}>
                  {pokemon.image} {pokemon.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location Name *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Central Park, New York"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Coordinates *</label>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
              >
                📍 Use My Location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="-?[0-9]*[.,]?[0-9]*"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Latitude (40.7128)"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="-?[0-9]*[.,]?[0-9]*"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longitude (-74.0060)"
                  required
                />
              </div>
            </div>
          </div>

          {/* Weather Display */}
          <div className="bg-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Current Weather at Location</label>
            {weatherLoading ? (
              <div className="text-gray-400 text-sm flex items-center">
                <span className="animate-spin mr-2">🔄</span> Fetching weather...
              </div>
            ) : weatherError ? (
              <div className="text-yellow-400 text-sm">{weatherError}</div>
            ) : weather ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getWeatherEmoji(weather.condition)}</span>
                  <div>
                    <div className="font-semibold">{weather.condition}</div>
                    <div className="text-sm text-gray-400">
                      {weather.temperature}°F • Humidity: {weather.humidity}%
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>💨 {weather.windSpeed} mph</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                Enter coordinates to see weather
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Any additional details about the sighting..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => handleChange('timestamp', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="bg-gray-700 rounded-lg p-3 text-sm">
            <div className="text-gray-400">Reporting as:</div>
            <div className="font-semibold">{currentUser}</div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Sighting'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
