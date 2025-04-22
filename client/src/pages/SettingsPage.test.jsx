import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import SettingsPage from './SettingsPage';

jest.mock('axios');

const mockSettings = {
  emailNotifications: true,
  calendarSync: {
    isConnected: true,
    isTokenValid: true,
  },
};

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('loads and displays settings', async () => {
    axios.get.mockResolvedValueOnce({ data: mockSettings });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Check loading state
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Google Calendar Sync')).toBeInTheDocument();
    });

    // Verify API call
    expect(axios.get).toHaveBeenCalledWith('/api/users/settings', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('handles email notification toggle', async () => {
    axios.get.mockResolvedValueOnce({ data: mockSettings });
    axios.put.mockResolvedValueOnce({
      data: {
        ...mockSettings,
        emailNotifications: false,
      },
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    });

    // Find and click the toggle button
    const toggleButton = screen.getByRole('button', { name: /email notifications/i });
    fireEvent.click(toggleButton);

    // Verify API call
    expect(axios.put).toHaveBeenCalledWith(
      '/api/users/settings',
      { emailNotifications: false },
      {
        headers: {
          Authorization: 'Bearer test-token',
        },
      }
    );

    // Wait for UI to update
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /email notifications/i })).toHaveClass('bg-gray-200');
    });
  });

  it('handles calendar connection', async () => {
    axios.get.mockResolvedValueOnce({ data: mockSettings });
    axios.get.mockResolvedValueOnce({ data: { authUrl: 'https://google-auth-url' } });

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Google Calendar Sync')).toBeInTheDocument();
    });

    // Find and click the disconnect button
    const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
    fireEvent.click(disconnectButton);

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      '/api/calendar/disconnect',
      {},
      {
        headers: {
          Authorization: 'Bearer test-token',
        },
      }
    );
  });

  it('displays error message when API calls fail', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
    });
  });

  it('shows warning when calendar token is expired', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        ...mockSettings,
        calendarSync: {
          isConnected: true,
          isTokenValid: false,
        },
      },
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Wait for warning message
    await waitFor(() => {
      expect(
        screen.getByText(/Your calendar connection needs to be renewed/i)
      ).toBeInTheDocument();
    });
  });
}); 