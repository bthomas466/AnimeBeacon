import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => {
  const mockLogin = jest.fn();
  return {
    AuthProvider: ({ children }) => children,
    useAuth: () => ({
      login: mockLogin,
      isAuthenticated: false,
      loading: false,
    }),
  };
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders login buttons', () => {
    renderLoginPage();
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
    expect(screen.getByText('Continue with Discord')).toBeInTheDocument();
  });

  it('calls login with correct provider when Google button is clicked', () => {
    const mockLogin = jest.fn();
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      isAuthenticated: false,
      loading: false,
    }));

    renderLoginPage();
    fireEvent.click(screen.getByText('Continue with Google'));

    expect(mockLogin).toHaveBeenCalledWith('google');
  });

  it('calls login with correct provider when Apple button is clicked', () => {
    const mockLogin = jest.fn();
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      isAuthenticated: false,
      loading: false,
    }));

    renderLoginPage();
    fireEvent.click(screen.getByText('Continue with Apple'));

    expect(mockLogin).toHaveBeenCalledWith('apple');
  });

  it('calls login with correct provider when Discord button is clicked', () => {
    const mockLogin = jest.fn();
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      isAuthenticated: false,
      loading: false,
    }));

    renderLoginPage();
    fireEvent.click(screen.getByText('Continue with Discord'));

    expect(mockLogin).toHaveBeenCalledWith('discord');
  });
}); 