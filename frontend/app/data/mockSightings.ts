import { Sighting } from '../types';

export const mockSightings: Sighting[] = [
  {
    id: 1,
    pokemonId: 1,
    pokemonName: 'Pikachu',
    latitude: 40.7128,
    longitude: -74.006,
    location: 'Central Park, New York',
    timestamp: '2025-11-12T10:30:00Z',
    weather: 'Sunny',
    reportedBy: 'trainer123',
  },
  {
    id: 2,
    pokemonId: 2,
    pokemonName: 'Charizard',
    latitude: 40.758,
    longitude: -73.9855,
    location: 'Times Square, New York',
    timestamp: '2025-11-12T14:15:00Z',
    weather: 'Clear',
    reportedBy: 'pokefan456',
  },
  {
    id: 3,
    pokemonId: 3,
    pokemonName: 'Mewtwo',
    latitude: 40.7484,
    longitude: -73.9857,
    location: 'Empire State Building',
    timestamp: '2025-11-11T20:00:00Z',
    weather: 'Cloudy',
    reportedBy: 'mastertrainer',
  },
  {
    id: 4,
    pokemonId: 4,
    pokemonName: 'Dragonite',
    latitude: 40.7614,
    longitude: -73.9776,
    location: 'Central Park Lake',
    timestamp: '2025-11-12T08:45:00Z',
    weather: 'Windy',
    reportedBy: 'dragonmaster',
  },
  {
    id: 5,
    pokemonId: 5,
    pokemonName: 'Gengar',
    latitude: 40.7089,
    longitude: -74.0012,
    location: 'Brooklyn Bridge',
    timestamp: '2025-11-11T22:30:00Z',
    weather: 'Foggy',
    reportedBy: 'ghosthunter',
  },
];

export const getUserSightings = (username: string): Sighting[] => {
  return mockSightings.filter(s => s.reportedBy === username);
};
