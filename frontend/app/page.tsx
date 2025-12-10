'use client';

import { useState } from 'react';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import SightingForm from './components/SightingForm';
import DeleteSightingPanel from './components/DeleteSightingPanel';
import LoginModal from './components/LoginModal';
import OrganizationPanel from './components/OrganizationPanel';
import EventsPanel from './components/EventsPanel';
import { Pokemon } from './types';

export default function Home() {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    minCP: '',
    maxCP: '',
    rarity: '',
    distance: '100',
    weather: '',
    city: '',
  });
  const [showSightingForm, setShowSightingForm] = useState(false);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOrganizationPanel, setShowOrganizationPanel] = useState(false);
  const [showEventsPanel, setShowEventsPanel] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [attemptedAction, setAttemptedAction] = useState<'submit' | 'delete' | 'orgs' | 'events' | null>(null);

  const handleSubmitSighting = () => {
    if (!isLoggedIn) {
      setAttemptedAction('submit');
      setShowLoginModal(true);
    } else {
      setShowSightingForm(true);
    }
  };

  const handleDeleteSighting = () => {
    if (!isLoggedIn) {
      setAttemptedAction('delete');
      setShowLoginModal(true);
    } else {
      setShowDeletePanel(true);
    }
  };

  const handleOrganizations = () => {
    if (!isLoggedIn) {
      setAttemptedAction('orgs');
      setShowLoginModal(true);
    } else {
      setShowOrganizationPanel(true);
    }
  };

  const handleEvents = () => {
    if (!isLoggedIn) {
      setAttemptedAction('events');
      setShowLoginModal(true);
    } else {
      setShowEventsPanel(true);
    }
  };

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
    setShowLoginModal(false);
    
    // Execute the attempted action after login
    if (attemptedAction === 'submit') {
      setShowSightingForm(true);
    } else if (attemptedAction === 'delete') {
      setShowDeletePanel(true);
    } else if (attemptedAction === 'orgs') {
      setShowOrganizationPanel(true);
    } else if (attemptedAction === 'events') {
      setShowEventsPanel(true);
    }
    setAttemptedAction(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-96 flex flex-col bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="text-3xl font-bold mb-2">⚡ PokéSight</h1>
          <p className="text-sm text-gray-200">Smart Pokémon Location Finder</p>
          {isLoggedIn && (
            <div className="mt-2 text-xs text-gray-200">
              Logged in as: <span className="font-semibold">{currentUser}</span>
            </div>
          )}
        </div>

        {/* Search Panel */}
        <SearchPanel 
          onSelectPokemon={setSelectedPokemon}
          filters={filters}
        />

        {/* Bottom Buttons */}
        <div className="p-4 space-y-2 border-t border-gray-700">
          <button
            onClick={handleSubmitSighting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            ➕ Submit a Pokémon Sighting
          </button>
          <button
            onClick={handleDeleteSighting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            📋 Manage My Sightings
          </button>
          <button
            onClick={handleOrganizations}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            🏢 Organizations
          </button>
          <button
            onClick={handleEvents}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            📅 Events
          </button>
          {!isLoggedIn ? (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              🔐 Login
            </button>
          ) : (
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentUser('');
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Filter Panel */}
        <FilterPanel 
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* Map View */}
        <MapView 
          selectedPokemon={selectedPokemon}
          filters={filters}
        />
      </div>

      {/* Modals */}
      {showSightingForm && (
        <SightingForm 
          onClose={() => setShowSightingForm(false)}
          currentUser={currentUser}
        />
      )}

      {showDeletePanel && (
        <DeleteSightingPanel 
          onClose={() => setShowDeletePanel(false)}
          currentUser={currentUser}
        />
      )}

      {showOrganizationPanel && (
        <OrganizationPanel 
          onClose={() => setShowOrganizationPanel(false)}
          currentUser={currentUser}
        />
      )}

      {showEventsPanel && (
        <EventsPanel 
          onClose={() => setShowEventsPanel(false)}
          currentUser={currentUser}
        />
      )}

      {showLoginModal && (
        <LoginModal 
          onClose={() => {
            setShowLoginModal(false);
            setAttemptedAction(null);
          }}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}
