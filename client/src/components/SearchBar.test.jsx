import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import SearchBar from './SearchBar';

// Mock fetch
global.fetch = jest.fn();

// Mock search results
const mockSearchResults = {
  results: [
    {
      id: '1',
      title: 'Test Anime 1',
      coverImage: 'https://example.com/image1.jpg'
    },
    {
      id: '2',
      title: 'Test Anime 2',
      coverImage: 'https://example.com/image2.jpg'
    }
  ]
};

// Mock watchlist response
const mockWatchlistResponse = {
  id: 'watchlist-1',
  userId: 'user-123',
  showId: '1',
  status: 'watching'
};

describe('SearchBar', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  const renderSearchBar = () => {
    return render(
      <AuthProvider>
        <SearchBar />
      </AuthProvider>
    );
  };

  it('renders search input and button', () => {
    renderSearchBar();
    
    expect(screen.getByPlaceholderText('Search for anime...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('performs search and displays results', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResults)
      })
    );

    renderSearchBar();

    // Enter search query and submit
    const searchInput = screen.getByPlaceholderText('Search for anime...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
      expect(screen.getByText('Test Anime 2')).toBeInTheDocument();
    });

    // Verify API call
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search?q=test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.any(String)
        })
      })
    );
  });

  it('handles search error', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false
      })
    );

    renderSearchBar();

    // Enter search query and submit
    const searchInput = screen.getByPlaceholderText('Search for anime...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to search shows')).toBeInTheDocument();
    });
  });

  it('adds show to watchlist and updates UI', async () => {
    // Mock search response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResults)
      })
    );

    // Mock watchlist add response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWatchlistResponse)
      })
    );

    renderSearchBar();

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search for anime...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
    });

    // Click add to watchlist button
    const addButton = screen.getByRole('button', { name: 'Add to Watchlist' });
    fireEvent.click(addButton);

    // Wait for button to be disabled and text to change
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Added to Watchlist' })).toBeDisabled();
    });

    // Verify API call
    expect(fetch).toHaveBeenCalledWith(
      '/api/watchlist',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.any(String),
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ showId: '1' })
      })
    );
  });

  it('handles add to watchlist error', async () => {
    // Mock search response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResults)
      })
    );

    // Mock watchlist add error
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false
      })
    );

    renderSearchBar();

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search for anime...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
    });

    // Click add to watchlist button
    const addButton = screen.getByRole('button', { name: 'Add to Watchlist' });
    fireEvent.click(addButton);

    // Button should remain enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add to Watchlist' })).not.toBeDisabled();
    });
  });
}); 