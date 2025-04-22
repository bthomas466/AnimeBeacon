import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import WatchlistPage from './WatchlistPage';

// Mock fetch
global.fetch = jest.fn();

// Mock watchlist data
const mockWatchlist = [
  {
    id: 'watchlist-1',
    userId: 'user-123',
    showId: 'show-1',
    status: 'watching',
    show: {
      id: 'show-1',
      title: 'Test Anime 1',
      coverImage: 'https://example.com/image1.jpg',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-03-31T00:00:00.000Z',
      platforms: ['netflix']
    }
  },
  {
    id: 'watchlist-2',
    userId: 'user-123',
    showId: 'show-2',
    status: 'completed',
    show: {
      id: 'show-2',
      title: 'Another Anime',
      coverImage: 'https://example.com/image2.jpg',
      startDate: '2023-04-01T00:00:00.000Z',
      endDate: null,
      platforms: ['crunchyroll']
    }
  }
];

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    watchlist: mockWatchlist,
    refreshWatchlist: jest.fn()
  }),
  AuthProvider: ({ children }) => children
}));

const mockUser = {
  id: 1,
  notificationPreferences: {
    enabled: true
  },
  calendarPreferences: {
    enabled: true
  }
};

const mockShow = {
  id: 1,
  title: 'Test Show',
  imageUrl: 'https://example.com/image.jpg',
  genres: ['Action', 'Adventure']
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('WatchlistPage', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  const renderWatchlistPage = () => {
    return render(
      <AuthProvider>
        <WatchlistPage />
      </AuthProvider>
    );
  };

  it('loads watchlist from context on mount', async () => {
    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });

    // Check grid layout
    const grid = screen.getByRole('list');
    expect(grid).toHaveClass('grid');
  });

  it('displays correct airing status for each show', async () => {
    renderWatchlistPage();

    await waitFor(() => {
      expect(screen.getByText('finished')).toBeInTheDocument();
      expect(screen.getByText('airing')).toBeInTheDocument();
    });
  });

  it('updates show status and refreshes watchlist', async () => {
    const mockRefreshWatchlist = jest.fn();
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      watchlist: mockWatchlist,
      refreshWatchlist: mockRefreshWatchlist
    }));

    // Mock status update
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...mockWatchlist[0], status: 'completed' })
      })
    );

    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
    });

    // Click complete button
    const completeButton = screen.getByRole('button', { name: 'Complete' });
    fireEvent.click(completeButton);

    // Verify API call
    expect(fetch).toHaveBeenCalledWith(
      '/api/watchlist/show-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Authorization': expect.any(String),
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ status: 'completed' })
      })
    );

    // Verify watchlist refresh was called
    await waitFor(() => {
      expect(mockRefreshWatchlist).toHaveBeenCalled();
    });
  });

  it('handles status update errors', async () => {
    // Mock failed status update
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false
      })
    );

    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
    });

    // Click complete button
    const completeButton = screen.getByRole('button', { name: 'Complete' });
    fireEvent.click(completeButton);

    // Button should not change state on error
    await waitFor(() => {
      expect(completeButton).not.toHaveClass('bg-green-500');
    });
  });

  it('displays loading state', () => {
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      watchlist: null,
      refreshWatchlist: jest.fn()
    }));

    renderWatchlistPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      watchlist: null,
      refreshWatchlist: jest.fn()
    }));

    renderWatchlistPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load watchlist')).toBeInTheDocument();
    });
  });

  it('applies status filter correctly', async () => {
    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });

    // Select status filter
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    // Wait for filtered results
    await waitFor(() => {
      expect(screen.queryByText('Test Anime 1')).not.toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });
  });

  it('applies platform filter correctly', async () => {
    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });

    // Select platform filter
    const platformSelect = screen.getByLabelText('Platform');
    fireEvent.change(platformSelect, { target: { value: 'netflix' } });

    // Wait for filtered results
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.queryByText('Another Anime')).not.toBeInTheDocument();
    });
  });

  it('applies sort correctly', async () => {
    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });

    // Select sort option
    const sortSelect = screen.getByLabelText('Sort By');
    fireEvent.change(sortSelect, { target: { value: 'title' } });

    // Get all show titles in order
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(titles).toEqual(['Another Anime', 'Test Anime 1']);
  });

  it('clears all filters when clear button is clicked', async () => {
    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });

    // Apply a filter
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    // Wait for filtered results
    await waitFor(() => {
      expect(screen.queryByText('Test Anime 1')).not.toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });

    // Click clear filters button
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Wait for all items to be displayed again
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });
  });

  it('displays empty state when no results match filters', async () => {
    renderWatchlistPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Another Anime')).toBeInTheDocument();
    });

    // Apply a filter that will return no results
    const platformSelect = screen.getByLabelText('Platform');
    fireEvent.change(platformSelect, { target: { value: 'funimation' } });

    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText('No shows found. Try adjusting your filters.')).toBeInTheDocument();
    });
  });

  it('syncs with updated watchlist from context', async () => {
    const updatedWatchlist = [
      {
        ...mockWatchlist[0],
        status: 'completed'
      },
      ...mockWatchlist.slice(1)
    ];

    // Initial render with original watchlist
    const { rerender } = renderWatchlistPage();
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
    });

    // Update context with new watchlist
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
      watchlist: updatedWatchlist,
      refreshWatchlist: jest.fn()
    }));

    // Rerender with updated context
    rerender(
      <AuthProvider>
        <WatchlistPage />
      </AuthProvider>
    );

    // Verify UI reflects the updated status
    await waitFor(() => {
      const completeButton = screen.getByRole('button', { name: 'Complete' });
      expect(completeButton).toHaveClass('bg-green-500');
    });
  });

  it('displays next episode date when available', async () => {
    const mockNextEpisode = {
      airDate: '2024-03-20T15:00:00Z'
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNextEpisode)
      })
    );

    renderWithProviders(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText(/Next Episode:/)).toBeInTheDocument();
      expect(screen.getByText(/3\/20\/2024/)).toBeInTheDocument();
    });
  });

  it('shows reminder and calendar labels when enabled', () => {
    renderWithProviders(<WatchlistPage />);

    expect(screen.getByText('Reminder On')).toBeInTheDocument();
    expect(screen.getByText('Calendar Synced')).toBeInTheDocument();
  });

  it('does not show labels when preferences are disabled', () => {
    const userWithoutPreferences = {
      ...mockUser,
      notificationPreferences: { enabled: false },
      calendarPreferences: { enabled: false }
    };

    renderWithProviders(<WatchlistPage user={userWithoutPreferences} />);

    expect(screen.queryByText('Reminder On')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendar Synced')).not.toBeInTheDocument();
  });

  it('does not show next episode section when no episode is available', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false
      })
    );

    renderWithProviders(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Next Episode:/)).not.toBeInTheDocument();
    });
  });
}); 