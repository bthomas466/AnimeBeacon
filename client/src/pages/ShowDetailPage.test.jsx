import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ShowDetailPage from './ShowDetailPage';

// Mock fetch
global.fetch = jest.fn();

// Mock Date to control the current date in tests
const mockDate = new Date('2024-06-15');
const originalDate = global.Date;

const mockShow = {
  id: 1,
  title: {
    romaji: 'Test Show',
    english: 'Test Show English'
  },
  synopsis: 'Test synopsis',
  coverImage: {
    large: 'https://example.com/image.jpg'
  },
  status: 'RELEASING',
  episodes: 12,
  platforms: [
    {
      name: 'Crunchyroll',
      logo: 'https://logo.clearbit.com/crunchyroll.com',
      url: 'https://crunchyroll.com/watch/123',
      hasSub: true,
      hasDub: false,
      isPrimary: true
    },
    {
      name: 'Netflix',
      logo: 'https://logo.clearbit.com/netflix.com',
      url: 'https://netflix.com/watch/456',
      hasSub: true,
      hasDub: true,
      isPrimary: false
    }
  ],
  episodes: [
    {
      id: 1,
      number: 1,
      title: 'Episode 1',
      airDate: '2024-01-01',
      isWatched: true
    },
    {
      id: 2,
      number: 2,
      title: 'Episode 2',
      airDate: '2024-01-08',
      isWatched: false
    }
  ]
};

const renderShowDetailPage = () => {
  return render(
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/show/:id" element={<ShowDetailPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

describe('ShowDetailPage', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Set the current date to a fixed value for consistent testing
    global.Date = class extends Date {
      constructor() {
        return mockDate;
      }
    };
  });

  afterEach(() => {
    // Restore the original Date
    global.Date = originalDate;
  });

  it('should display loading state initially', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    renderShowDetailPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display show details when loaded', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Test Show English')).toBeInTheDocument();
      expect(screen.getByText('Test synopsis')).toBeInTheDocument();
      expect(screen.getByAltText('Test Show English')).toBeInTheDocument();
    });
  });

  it('should display error state when API call fails', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display not found state when show is null', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/show not found/i)).toBeInTheDocument();
    });
  });

  it('should display airing status with correct styling', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      const statusBadge = screen.getByText('RELEASING');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  it('should display platforms with primary platform highlighted', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      // Primary platform (Crunchyroll) should be first and highlighted
      const primaryPlatform = screen.getByText('Crunchyroll').closest('a');
      expect(primaryPlatform).toHaveClass('border-2', 'border-blue-500', 'bg-blue-50');
      expect(screen.getByText('Primary')).toBeInTheDocument();

      // Secondary platform (Netflix) should not be highlighted
      const secondaryPlatform = screen.getByText('Netflix').closest('a');
      expect(secondaryPlatform).not.toHaveClass('border-2', 'border-blue-500', 'bg-blue-50');
    });
  });

  it('should display platform sub/dub indicators correctly', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      // Crunchyroll has sub only
      const crunchyrollPlatform = screen.getByText('Crunchyroll').closest('a');
      expect(crunchyrollPlatform).toHaveTextContent('Sub');
      expect(crunchyrollPlatform).not.toHaveTextContent('Dub');

      // Netflix has both sub and dub
      const netflixPlatform = screen.getByText('Netflix').closest('a');
      expect(netflixPlatform).toHaveTextContent('Sub');
      expect(netflixPlatform).toHaveTextContent('Dub');
    });
  });

  it('should display episode information with watched status', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      // Episode 1 (watched)
      const episode1 = screen.getByText('Episode 1');
      expect(episode1.closest('div')).toHaveClass('bg-gray-50');
      expect(screen.getByText('Watched')).toBeInTheDocument();

      // Episode 2 (not watched)
      const episode2 = screen.getByText('Episode 2');
      expect(episode2.closest('div')).not.toHaveClass('bg-gray-50');
      expect(screen.queryByText('Watched')).not.toBeInTheDocument();
    });
  });

  it('displays correct airing status with appropriate styling', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      const statusBadge = screen.getByText('Airing');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  it('displays platform information correctly', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      const platformLink = screen.getByText('Netflix').closest('a');
      expect(platformLink).toHaveAttribute('href', 'https://netflix.com/watch/123');
      expect(platformLink).toHaveAttribute('target', '_blank');
      expect(screen.getByText('Sub')).toBeInTheDocument();
      expect(screen.queryByText('Dub')).not.toBeInTheDocument();
    });
  });

  it('displays episode information with watched status', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Sub')).toHaveClass('bg-green-100', 'text-green-800');
      expect(screen.getByText('Dub')).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  it('highlights the next upcoming episode', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      // Episode 3 is the next episode (airing on 2024-06-20)
      const nextEpisodeElement = screen.getByText('Episode 3: Episode 3').closest('div');
      expect(nextEpisodeElement).toHaveClass('bg-indigo-50', 'border-indigo-200', 'shadow-md');
      expect(screen.getByText('Next Episode')).toBeInTheDocument();
    });
  });

  it('handles shows with no upcoming episodes', async () => {
    // Create a show with all episodes in the past
    const pastShow = {
      ...mockShow,
      episodes: [
        {
          id: 1,
          number: 1,
          title: 'Episode 1',
          airDate: '2024-01-01',
          subWatched: true,
          dubWatched: false
        },
        {
          id: 2,
          number: 2,
          title: 'Episode 2',
          airDate: '2024-01-08',
          subWatched: false,
          dubWatched: true
        }
      ]
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(pastShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      // No "Next Episode" label should be present
      expect(screen.queryByText('Next Episode')).not.toBeInTheDocument();
    });
  });

  it('handles shows with no episodes', async () => {
    // Create a show with no episodes
    const noEpisodesShow = {
      ...mockShow,
      episodes: []
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(noEpisodesShow)
      })
    );

    renderShowDetailPage();

    await waitFor(() => {
      // The page should still render without errors
      expect(screen.getByText('Test Show')).toBeInTheDocument();
    });
  });
}); 