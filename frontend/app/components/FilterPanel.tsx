'use client';

import { Filters } from '../types';
import { useState, useEffect } from 'react';

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const pokemonTypes = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic',
  'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

const rarities = ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical'];
const weatherTypes = ['Sunny', 'Clear', 'Cloudy', 'Rainy', 'Windy', 'Foggy', 'Snowy'];

// List of major cities - can be expanded
const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
  'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston',
  'Nashville', 'Detroit', 'Portland', 'Las Vegas', 'Miami',
  'Atlanta', 'Minneapolis', 'Champaign', 'Urbana', 'Springfield'
].sort();

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [cityInput, setCityInput] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  // Filter cities based on input
  useEffect(() => {
    if (cityInput.length > 0) {
      const matches = cities.filter(city => 
        city.toLowerCase().includes(cityInput.toLowerCase())
      );
      setFilteredCities(matches);
      setShowCityDropdown(matches.length > 0);
    } else {
      setFilteredCities([]);
      setShowCityDropdown(false);
    }
  }, [cityInput]);

  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleCitySelect = (city: string) => {
    handleChange('city', city);
    setCityInput(city);
    setShowCityDropdown(false);
  };

  const resetFilters = () => {
    onFilterChange({
      type: '',
      minCP: '',
      maxCP: '',
      rarity: '',
      distance: '5',
      weather: '',
      city: '',
    });
    setCityInput('');
  };

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Filters</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Pokémon Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {pokemonTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">City Name</label>
          <input
            type="text"
            placeholder="Type a city name..."
            value={cityInput}
            onChange={(e) => {
              setCityInput(e.target.value);
              if (e.target.value === '') {
                handleChange('city', '');
              }
            }}
            onFocus={() => cityInput && setShowCityDropdown(filteredCities.length > 0)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Autocomplete Dropdown */}
          {showCityDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto border border-gray-600">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
          
          {filters.city && (
            <div className="mt-1 text-xs text-green-400">
              ✓ Selected: {filters.city}
            </div>
          )}
        </div>

        {/* Rarity Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Rarity</label>
          <select
            value={filters.rarity}
            onChange={(e) => handleChange('rarity', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Rarities</option>
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        {/* Combat Power Range */}
        <div>
          <label className="block text-sm font-medium mb-2">Combat Power (CP)</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min CP"
              value={filters.minCP}
              onChange={(e) => handleChange('minCP', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max CP"
              value={filters.maxCP}
              onChange={(e) => handleChange('maxCP', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Distance Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Distance: {filters.distance} miles
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={filters.distance}
            onChange={(e) => handleChange('distance', e.target.value)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1 mi</span>
            <span>100 mi</span>
          </div>
        </div>

        {/* Weather Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Weather Condition</label>
          <select
            value={filters.weather}
            onChange={(e) => handleChange('weather', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Weather</option>
            {weatherTypes.map((weather) => (
              <option key={weather} value={weather}>
                {weather}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Summary */}
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-sm font-medium mb-2">Active Filters:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            {filters.city && <div>• City: {filters.city}</div>}
            {filters.type && <div>• Type: {filters.type}</div>}
            {filters.rarity && <div>• Rarity: {filters.rarity}</div>}
            {filters.minCP && <div>• Min CP: {filters.minCP}</div>}
            {filters.maxCP && <div>• Max CP: {filters.maxCP}</div>}
            {filters.weather && <div>• Weather: {filters.weather}</div>}
            {!filters.city && !filters.type && !filters.rarity && !filters.minCP && !filters.maxCP && !filters.weather && (
              <div className="text-gray-500">No filters applied</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
