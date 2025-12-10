'use client';

import { useState, useEffect } from 'react';
import { Event } from '../types';

interface EventsPanelProps {
  onClose: () => void;
  currentUser: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function EventsPanel({ onClose, currentUser }: EventsPanelProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-events' | 'create'>('browse');
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [userOrganization, setUserOrganization] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create event form
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [participantCount, setParticipantCount] = useState('0');

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      if (response.ok) {
        setEvents(data);
      } else {
        setError(data.message || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch events user has reported on
  const fetchMyEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events/user/${currentUser}`);
      const data = await response.json();
      if (response.ok) {
        setMyEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch my events');
    }
  };

  // Fetch user's organization
  const fetchUserOrganization = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/${currentUser}/organization`);
      const data = await response.json();
      if (response.ok) {
        setUserOrganization(data.organizationName);
      }
    } catch (err) {
      console.error('Failed to fetch user organization');
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
    fetchUserOrganization();
  }, [currentUser]);

  // Create event (only if user has an organization)
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userOrganization) {
      setError('You must be in an organization to create events');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName,
          description: eventDescription,
          location: eventLocation,
          time: eventTime,
          participantCount: parseInt(participantCount),
          organizationName: userOrganization,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Event created successfully!');
        // Reset form
        setEventName('');
        setEventDescription('');
        setEventLocation('');
        setEventTime('');
        setParticipantCount('0');
        fetchEvents();
        fetchMyEvents();
        setActiveTab('browse');
      } else {
        setError(data.message || 'Failed to create event');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Join event (create a report for this event)
  const handleJoinEvent = async (eventId: number) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Joined event successfully!');
        fetchEvents();
        fetchMyEvents();
      } else {
        setError(data.message || 'Failed to join event');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  // Leave event
  const handleLeaveEvent = async (eventId: number) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Left event successfully!');
        fetchEvents();
        fetchMyEvents();
      } else {
        setError(data.message || 'Failed to leave event');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Event deleted successfully!');
        fetchEvents();
        fetchMyEvents();
      } else {
        setError(data.message || 'Failed to delete event');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const isUserInEvent = (eventId: number) => {
    return myEvents.some(event => event.eventId === eventId);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[700px] max-h-[85vh] shadow-2xl flex flex-col">
        <h2 className="text-2xl font-bold mb-4">📅 Events</h2>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'browse' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Browse Events
          </button>
          <button
            onClick={() => setActiveTab('my-events')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'my-events' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            My Events
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'create' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            + Create Event
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded-lg text-green-300">
            {success}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto mb-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : activeTab === 'browse' ? (
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">📅</div>
                  <p>No events scheduled. Create one!</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.eventId} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🎮</span>
                          <h3 className="font-bold text-lg">{event.eventName}</h3>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{event.description}</p>
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <div>📍 {event.location}</div>
                          <div>🏢 {event.organizationName}</div>
                          <div>🕐 {formatDateTime(event.time)}</div>
                          <div>👥 {event.participantCount} participants</div>
                        </div>
                      </div>
                      {!isUserInEvent(event.eventId) ? (
                        <button
                          onClick={() => handleJoinEvent(event.eventId)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Join
                        </button>
                      ) : (
                        <span className="text-green-400 text-sm font-semibold">✓ Joined</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'my-events' ? (
            <div className="space-y-3">
              {myEvents.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p>You haven't joined any events yet.</p>
                </div>
              ) : (
                myEvents.map((event) => (
                  <div key={event.eventId} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🎮</span>
                          <h3 className="font-bold text-lg">{event.eventName}</h3>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{event.description}</p>
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <div>📍 {event.location}</div>
                          <div>🏢 {event.organizationName}</div>
                          <div>🕐 {formatDateTime(event.time)}</div>
                          <div>👥 {event.participantCount} participants</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {event.organizationName === userOrganization && (
                          <button
                            onClick={() => handleDeleteEvent(event.eventId)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => handleLeaveEvent(event.eventId)}
                          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              {!userOrganization ? (
                <div className="text-center text-yellow-400 py-4 bg-yellow-900 bg-opacity-30 rounded-lg">
                  ⚠️ You need to join an organization first to create events.
                </div>
              ) : (
                <>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Creating event for organization:</div>
                    <div className="font-semibold">{userOrganization}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Name</label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter event name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-24"
                      placeholder="Describe the event..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter location (e.g., Central Park, NYC)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </button>
                </>
              )}
            </form>
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
    </div>
  );
}
