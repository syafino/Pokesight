'use client';

import { useState, useEffect } from 'react';
import { Pokemon, Filters } from '../types';

interface SearchPanelProps {
  onSelectPokemon: (pokemon: Pokemon | null) => void;
  filters: Filters;
}

// Backend API URL - adjust if your backend runs on a different port
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SearchPanel({ onSelectPokemon, filters }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pokemonList, setPokemonList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Pokémon from backend when city filter changes
  useEffect(() => {
    const fetchPokemon = async () => {
      // Only fetch if city is selected
      if (!filters.city) {
        setPokemonList([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const bodyPayload = {
          // type: string;
          // minCP: string;
          // maxCP: string;
          // rarity: string;
          // distance: string;
          // weather: string;
          // city: string;

          city: filters.city,
          range: parseInt(filters.distance) || 100,
          type: filters.type,
          rarity: filters.rarity,
          weather: filters.weather,
          minCP: parseInt(filters.minCP),
          maxCP: parseInt(filters.maxCP)
        }
        const response = await fetch(`${API_BASE_URL}/api/get_pokemon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch Pokémon');
        }

        const data = await response.json();
        // Extract pokemon names from the response
        const names = data.map((item: any) => item.pokemon_name);
        setPokemonList(names);
      } catch (err) {
        console.error('Error fetching Pokémon:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch Pokémon');
        setPokemonList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [filters.city, filters.distance, filters.type, filters.rarity, filters.weather, filters.minCP, filters.maxCP]);

  // Filter Pokémon list based on search query
  const filteredPokemon = pokemonList.filter(name => 
    !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <input
          type="text"
          placeholder="Search Pokémon by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filters.city && (
          <div className="mt-2 text-xs text-gray-400">
            Showing Pokémon within {filters.distance} miles of {filters.city}
          </div>
        )}
      </div>

      {/* Pokémon List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!filters.city ? (
          <div className="text-center text-gray-400 py-8">
            Please select a city to see Pokémon sightings
          </div>
        ) : loading ? (
          <div className="text-center text-gray-400 py-8">
            Loading Pokémon...
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">
            <div>Error: {error}</div>
            <div className="text-sm mt-2">Make sure the backend is running on {API_BASE_URL}</div>
          </div>
        ) : filteredPokemon.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {searchQuery ? 'No Pokémon found matching your search' : 'No Pokémon sightings found in this area'}
          </div>
        ) : (
          filteredPokemon.map((pokemonName, index) => (
            <div
              key={index}
              onClick={async () => {
              if (!pokemonName) return;

              try {
                setLoading(true);  // optionally show loading indicator
                const response = await fetch(`${API_BASE_URL}/api/get_pokemon_details`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: pokemonName }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Failed to fetch Pokémon details');
                }

                const data: Pokemon = await response.json();
                onSelectPokemon(data);
              } catch (err) {
                console.error('Error fetching Pokémon details:', err);
                // optionally show an error toast
              } finally {
                setLoading(false);
              }
            }}

              // onClick={() => {
              //   // For now, just create a simple Pokemon object
              //   // You may want to fetch full details from another endpoint
              //   const simplePokemon: Pokemon = {
              //     id: index,
              //     name: pokemonName,
              //     pokedexNumber: 0,
              //     type: [],
              //     rarity: '',
              //     baseAttack: 0,
              //     baseDefense: 0,
              //     baseStamina: 0,
              //     maxCP: 0,
              //     image: '🔵'
              //   };
              //   onSelectPokemon(simplePokemon);
              // }}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🔵</div>
                <div className="flex-1">
                  <div className="font-semibold">{pokemonName}</div>
                  <div className="text-xs text-gray-400">
                    Click to view sightings
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
