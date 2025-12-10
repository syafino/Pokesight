'use client';

import { useState, useEffect } from 'react';
import { Organization } from '../types';

interface OrganizationPanelProps {
  onClose: () => void;
  currentUser: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function OrganizationPanel({ onClose, currentUser }: OrganizationPanelProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-org' | 'create'>('browse');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [myOrganization, setMyOrganization] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create org form
  const [newOrgName, setNewOrgName] = useState('');

  // Fetch all organizations
  const fetchOrganizations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/organizations`);
      const data = await response.json();
      if (response.ok) {
        setOrganizations(data);
      } else {
        setError(data.message || 'Failed to fetch organizations');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's organization (from User table)
  const fetchMyOrganization = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/${currentUser}/organization`);
      const data = await response.json();
      if (response.ok) {
        setMyOrganization(data.organizationName);
      }
    } catch (err) {
      console.error('Failed to fetch user organization');
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchMyOrganization();
  }, [currentUser]);

  // Create organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: newOrgName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Organization created successfully!');
        setNewOrgName('');
        fetchOrganizations();
        // Auto-join the newly created org
        await handleJoinOrg(newOrgName);
        setActiveTab('my-org');
      } else {
        setError(data.message || 'Failed to create organization');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Join organization (updates User.organizationName)
  const handleJoinOrg = async (orgName: string) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/user/${currentUser}/organization`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationName: orgName }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Joined ${orgName} successfully!`);
        setMyOrganization(orgName);
        fetchOrganizations();
      } else {
        setError(data.message || 'Failed to join organization');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  // Leave organization (set User.organizationName to null or default)
  const handleLeaveOrg = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/api/user/${currentUser}/organization`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationName: null }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Left organization successfully!');
        setMyOrganization(null);
        fetchOrganizations();
      } else {
        setError(data.message || 'Failed to leave organization');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleDeleteOrg = async (orgName: string) => {
  if (!confirm('Are you sure you want to delete this organization? This cannot be undone.')) {
    return;
  }
  setError('');
  setSuccess('');
  try {
    const response = await fetch(
      `${API_URL}/api/organizations/${encodeURIComponent(orgName)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser,   // ✅ send the user id to backend
        }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      setSuccess('Organization deleted successfully!');
      if (myOrganization === orgName) {
        setMyOrganization(null);
      }
      fetchOrganizations();
    } else {
      setError(data.message || 'Failed to delete organization');
    }
  } catch (err) {
    setError('Failed to connect to server');
  }
};



  // Get member count for an organization
  const getMemberCount = (orgName: string) => {
    const org = organizations.find(o => o.organizationName === orgName);
    return (org as any)?.memberCount || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[600px] max-h-[85vh] shadow-2xl flex flex-col">
        <h2 className="text-2xl font-bold mb-4">🏢 Organizations</h2>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'browse' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Browse All
          </button>
          <button
            onClick={() => setActiveTab('my-org')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'my-org' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            My Organization
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'create' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            + Create New
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
              {organizations.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">🏢</div>
                  <p>No organizations yet. Create one!</p>
                </div>
              ) : (
                organizations.map((org) => (
                  <div key={org.organizationName} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{org.organizationName}</h3>
                        <div className="text-xs text-gray-400 mt-1">
                          👥 {(org as any).memberCount || 0} members
                        </div>
                      </div>
                      {myOrganization === org.organizationName ? (
                        <span className="text-green-400 text-sm font-semibold">✓ Your Org</span>
                      ) : (
                        <button
                          onClick={() => handleJoinOrg(org.organizationName)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'my-org' ? (
            <div>
              {myOrganization ? (
                <div className="bg-gray-700 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🏢</div>
                    <h3 className="font-bold text-2xl mb-2">{myOrganization}</h3>
                    <div className="text-gray-400 mb-4">
                      👥 {getMemberCount(myOrganization)} members
                    </div>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={handleLeaveOrg}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        Leave Organization
                      </button>
                      <button
                        onClick={() => handleDeleteOrg(myOrganization)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        Delete Organization
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p>You haven't joined any organization yet.</p>
                  <p className="text-sm mt-2">Browse organizations or create your own!</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Organization Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter organization name"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  This will be the unique identifier for your organization.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
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
