export interface Pokemon {
  id: number;
  name: string;
  pokedexNumber: number;
  type: string[];
  rarity: string;
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  maxCP: number;
  image: string;
}

export interface Sighting {
  id?: number;
  sightingId?: string;
  pokemonId?: number;  // for mock data
  pokemon_id?: number; // from database
  pokemon_name?: string;
  pokemonName?: string;
  latitude: number | string;
  longitude: number | string;
  location?: string;
  timestamp?: string;
  reportTime?: string;
  appearedTimeOfDay?: string;
  weather?: string;
  temperature?: number | string;
  windSpeed?: number | string;
  reportedBy?: string;
  reportId?: number;
  status?: string;
  notes?: string;
}

export interface Filters {
  type: string;
  minCP: string;
  maxCP: string;
  rarity: string;
  distance: string;
  weather: string;
  city: string;
}

export interface Organization {
  organizationName: string; // PK
}

export interface Event {
  eventId: number; // PK
  eventName: string;
  description: string;
  location: string;
  time: string; // DATETIME
  participantCount: number;
  organizationName: string; // FK to Organizations
}

export interface Report {
  reportId: number; // PK
  sightingId: number; // FK to Sighting
  userId: string; // FK to User
  eventId: number; // FK to Events
  status: string;
  notes: string;
  time: string; // DATETIME
}
