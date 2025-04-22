import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../App';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => {
  const mockNavigate = jest.fn();
  return {
    AuthProvider: ({ children }) => children,
    useAuth: jest.fn(),
  };
});

// Mock component to render inside protected route
const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users to login page', () => {
    // Mock unauthenticated user
    useAuth.mockImplementation(() => ({
      isAuthenticated: false,
      loading: false,
      user: null,
    }));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to login page
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows authenticated users to access protected routes', () => {
    // Mock authenticated user
    useAuth.mockImplementation(() => ({
      isAuthenticated: true,
      loading: false,
      user: { id: '123', language: 'en', timezone: 'UTC' },
    }));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects users who need onboarding to the onboarding page', () => {
    // Mock authenticated user without language or timezone
    useAuth.mockImplementation(() => ({
      isAuthenticated: true,
      loading: false,
      user: { id: '123' },
    }));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to onboarding page
    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading state while authentication is being checked', () => {
    // Mock loading state
    useAuth.mockImplementation(() => ({
      isAuthenticated: false,
      loading: true,
      user: null,
    }));

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
}); 