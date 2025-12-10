'use client';

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { Pokemon, Filters } from '../types';
import { mockSightings } from '../data/mockSightings';
import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';


interface MapViewProps {
  selectedPokemon: Pokemon | null;
  filters: Filters;
}

function MapCenterUpdater({ center }: { center: google.maps.LatLngLiteral }) {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  return null;
}


export default function MapView({ selectedPokemon, filters }: MapViewProps) {
  const [selectedMarker, setSelectedMarker] = useState<number | string | null>(null);
  
  const [sightings, setSightings] = useState<any[]>([]);
  const [loadingSightings, setLoadingSightings] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  
  // Filter sightings based on selected Pokemon and filters
  // const filteredSightings = mockSightings.filter(sighting => {
  //   const pokemonId = sighting.pokemonId || sighting.pokemon_id;
  //   if (selectedPokemon && pokemonId !== selectedPokemon.id) {
  //     return false;
  //   }
  //   if (filters.weather && sighting.weather !== filters.weather) {
  //     return false;
  //   }
  //   return true;
  // });

  const filteredSightings = sightings; // no local filtering anymore


  // Calculate map center based on sightings
  const mapCenter = filteredSightings.length > 0
    ? {
        lat: filteredSightings.reduce((sum, s) => sum + Number(s.latitude), 0) / filteredSightings.length,
        lng: filteredSightings.reduce((sum, s) => sum + Number(s.longitude), 0) / filteredSightings.length,
      }
    : { lat: 40.1105, lng: -88.2073 }; // Default to Urbana-Champaign

  useEffect(() => {
    if (!selectedPokemon || !filters.city) {
      setSightings([]);
      return;
    }

    const fetchSightings = async () => {
      setLoadingSightings(true);

      try {
        const res = await fetch(`${API_BASE_URL}/api/get_pokemon_sightings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedPokemon.name,
            city: filters.city,
            range: parseInt(filters.distance) || 5,
            weather: filters.weather,
            minCP: parseInt(filters.minCP),
            maxCP: parseInt(filters.maxCP),
          }),
        });

        if (!res.ok) throw new Error("Failed to fetch sightings");

        const data = await res.json();
        setSightings(data);
      } catch (err) {
        console.error("Error loading sightings:", err);
        setSightings([]);
      } finally {
        setLoadingSightings(false);
      }
    };

    fetchSightings();
  }, [
    selectedPokemon,
    filters.city,
    filters.distance,
    filters.weather,
    filters.minCP,
    filters.maxCP
  ]);


  // Get API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-lg max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-red-400">API Key Required</h2>
          <p className="mb-4">To use Google Maps, you need to:</p>
          <ol className="text-left space-y-2 mb-4">
            <li>1. Get an API key from Google Cloud Console</li>
            <li>2. Create a <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code> file</li>
            <li>3. Add: <code className="bg-gray-700 px-2 py-1 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key</code></li>
            <li>4. Restart the dev server</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={8}
          mapId="pokesight-map"
          className="w-full h-full"
        >
          <MapCenterUpdater center={mapCenter} />

          {/* Render markers for filtered sightings */}
          {filteredSightings.map((sighting) => {
            const markerId = sighting.id || sighting.sightingId || 0;
            return (
              <AdvancedMarker
                key={markerId}
                position={{ lat: Number(sighting.latitude), lng: Number(sighting.longitude) }}
                onClick={() => setSelectedMarker(markerId)}
              >
                <div className="text-4xl drop-shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  {selectedPokemon?.image || '📍'}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Info Window for selected marker */}
          {selectedMarker && (() => {
            const selected = filteredSightings.find(s => (s.id || s.sightingId) === selectedMarker);
            if (!selected) return null;
            return (
              <InfoWindow
                position={{
                  lat: Number(selected.latitude),
                  lng: Number(selected.longitude),
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="text-gray-900 p-2">
                  <div className="font-semibold mb-1">
                    {selected.location || 'Unknown'}
                  </div>
                  <div className="text-sm space-y-1">
                    <div>🕐 {selected.appearedTimeOfDay}</div>
                    <div>🌤️ {selected.weather}</div>
                    <div>By: {selected.reportedBy || 'Unknown'}</div>
                  </div>
                </div>
              </InfoWindow>
            );
          })()}
        </Map>
      </APIProvider>

      {/* Pokemon Info Card */}
      {selectedPokemon && (
        <div className="absolute top-4 left-4 bg-white rounded-lg p-4 shadow-xl max-w-sm z-10">
          <div className="flex items-start space-x-4">
            <div className="text-5xl">{selectedPokemon.image}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{selectedPokemon.name}</h2>
              <div className="text-sm text-gray-600 mb-2">
                #{selectedPokemon.pokedexNumber}
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedPokemon.type.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    {type}
                  </span>
                ))}
                <span className="px-2 py-1 bg-purple-600 text-white rounded text-xs">
                  {selectedPokemon.rarity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-600">Max CP</div>
                  <div className="font-semibold text-gray-900">{selectedPokemon.maxCP}</div>
                </div>
                <div>
                  <div className="text-gray-600">Attack</div>
                  <div className="font-semibold text-gray-900">{selectedPokemon.baseAttack}</div>
                </div>
                <div>
                  <div className="text-gray-600">Defense</div>
                  <div className="font-semibold text-gray-900">{selectedPokemon.baseDefense}</div>
                </div>
                <div>
                  <div className="text-gray-600">Stamina</div>
                  <div className="font-semibold text-gray-900">{selectedPokemon.baseStamina}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sightings Panel */}
      {selectedPokemon && (
        <div className="absolute top-4 right-4 bg-white rounded-lg p-4 shadow-xl w-80 max-h-96 overflow-y-auto z-10">
          <h3 className="text-lg font-bold mb-3 text-gray-900">
            Recent Sightings ({filteredSightings.length})
          </h3>
          {filteredSightings.length === 0 ? (
            <div className="text-gray-600 text-sm">
              No sightings found for this Pokémon with current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSightings.map((sighting) => {
                const markerId = sighting.id || sighting.sightingId || 0;
                return (
                  <div
                    key={markerId}
                    className="bg-gray-100 rounded-lg p-3 text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => setSelectedMarker(markerId)}
                  >
                    <div className="font-semibold mb-1 text-gray-900">{sighting.location || 'Unknown'}</div>
                    <div className="text-gray-600 space-y-1">
                      <div>📍 {Number(sighting.latitude).toFixed(4)}, {Number(sighting.longitude).toFixed(4)}</div>
                      <div>🕐 {sighting.appearedTimeOfDay}</div>
                      <div>🌤️ {sighting.weather}</div>
                      <div className="text-blue-600">By: {sighting.reportedBy || 'Unknown'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedPokemon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white bg-gray-900 bg-opacity-80 p-8 rounded-lg">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold mb-2">Select a Pokémon</h2>
            <p>Choose a Pokémon from the list to view its locations</p>
          </div>
        </div>
      )}
    </div>
  );
}
