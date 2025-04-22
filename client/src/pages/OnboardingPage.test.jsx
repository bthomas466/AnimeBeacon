import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import OnboardingPage from './OnboardingPage';

// Mock fetch
global.fetch = jest.fn();

// Mock the auth context
jest.mock('../contexts/AuthContext', () => {
  const mockNavigate = jest.fn();
  return {
    AuthProvider: ({ children }) => children,
    useAuth: () => ({
      user: { id: '123', email: 'test@example.com', name: 'Test User' },
      isAuthenticated: true,
      loading: false,
    }),
  };
});

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const renderOnboardingPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <OnboardingPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('OnboardingPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    global.fetch.mockReset();
  });

  it('renders onboarding form', () => {
    renderOnboardingPage();
    
    expect(screen.getByText('Welcome to Anime Tracker!')).toBeInTheDocument();
    expect(screen.getByText('Let\'s personalize your experience')).toBeInTheDocument();
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    expect(screen.getByLabelText('Receive notifications about new episodes')).toBeInTheDocument();
    expect(screen.getByText('Save Preferences')).toBeInTheDocument();
  });

  it('submits form data successfully', async () => {
    // Mock successful API response
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '123', language: 'en', timezone: 'America/New_York', notificationOptIn: true }),
      })
    );

    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    renderOnboardingPage();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Language'), { target: { name: 'language', value: 'es' } });
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { name: 'timezone', value: 'Europe/London' } });
    fireEvent.click(screen.getByLabelText('Receive notifications about new episodes'));
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Preferences'));
    
    // Check that the API was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/preferences',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: 'es',
            timezone: 'Europe/London',
            notificationOptIn: true,
          }),
        })
      );
    });
    
    // Check that the user was redirected
    expect(mockNavigate).toHaveBeenCalledWith('/watchlist');
  });

  it('handles API errors', async () => {
    // Mock failed API response
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save preferences' }),
      })
    );

    renderOnboardingPage();
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Preferences'));
    
    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to save preferences')).toBeInTheDocument();
    });
  });

  it('redirects to watchlist if user has already completed onboarding', () => {
    // Mock user with completed onboarding
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: { 
        id: '123', 
        email: 'test@example.com', 
        name: 'Test User',
        language: 'en',
        timezone: 'America/New_York',
        notificationOptIn: true
      },
      isAuthenticated: true,
      loading: false,
    }));

    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    renderOnboardingPage();
    
    // Check that the user was redirected
    expect(mockNavigate).toHaveBeenCalledWith('/watchlist');
  });
}); 