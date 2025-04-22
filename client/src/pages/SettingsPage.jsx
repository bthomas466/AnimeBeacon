import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: false,
    calendarSync: {
      isConnected: false,
      isTokenValid: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/users/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const handleEmailToggle = async () => {
    try {
      setSaving(true);
      const response = await axios.put(
        '/api/users/settings',
        {
          emailNotifications: !settings.emailNotifications,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSettings(response.data);
    } catch (error) {
      setError('Failed to update email notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleCalendarConnect = async () => {
    try {
      const response = await axios.get('/api/calendar/auth-url', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      window.location.href = response.data.authUrl;
    } catch (error) {
      setError('Failed to get calendar auth URL');
    }
  };

  const handleCalendarDisconnect = async () => {
    try {
      setSaving(true);
      await axios.post(
        '/api/calendar/disconnect',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSettings(prev => ({
        ...prev,
        calendarSync: {
          isConnected: false,
          isTokenValid: false,
        },
      }));
    } catch (error) {
      setError('Failed to disconnect calendar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Notification Settings
            </h3>
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            <div className="mt-6 space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Email Notifications
                  </h4>
                  <p className="text-sm text-gray-500">
                    Receive email reminders for upcoming episodes
                  </p>
                </div>
                <button
                  type="button"
                  className={`${
                    settings.emailNotifications
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  onClick={handleEmailToggle}
                  disabled={saving}
                >
                  <span
                    className={`${
                      settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>

              {/* Calendar Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Google Calendar Sync
                  </h4>
                  <p className="text-sm text-gray-500">
                    Add episodes to your Google Calendar
                  </p>
                </div>
                {settings.calendarSync.isConnected ? (
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleCalendarDisconnect}
                    disabled={saving}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleCalendarConnect}
                  >
                    Connect
                  </button>
                )}
              </div>

              {settings.calendarSync.isConnected && !settings.calendarSync.isTokenValid && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="text-sm text-yellow-600">
                    Your calendar connection needs to be renewed. Please reconnect your Google Calendar.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 