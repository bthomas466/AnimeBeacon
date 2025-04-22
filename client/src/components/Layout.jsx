import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';

export default function Layout() {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-600 text-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold">
                Anime Tracker
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
              >
                Home
              </Link>
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/watchlist"
                    className={({ isActive }) =>
                      `text-sm font-medium ${
                        isActive ? 'text-primary' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    Watchlist
                  </NavLink>
                  <NavLink
                    to="/calendar"
                    className={({ isActive }) =>
                      `text-sm font-medium ${
                        isActive ? 'text-primary' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    Calendar
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `text-sm font-medium ${
                        isActive ? 'text-primary' : 'text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-300 hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <p className="text-center">
            © {new Date().getFullYear()} Anime Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 