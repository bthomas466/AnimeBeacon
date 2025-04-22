import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addedShows, setAddedShows] = useState(new Set());
  const { token } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError('Failed to search shows');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (showId) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ showId })
      });

      if (!response.ok) {
        throw new Error('Failed to add show');
      }

      setAddedShows(prev => new Set([...prev, showId]));
    } catch (err) {
      console.error('Add to watchlist error:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anime..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((show) => (
          <div key={show.id} className="border rounded-lg p-4 flex flex-col">
            <img
              src={show.coverImage}
              alt={show.title}
              className="w-full h-48 object-cover rounded-lg mb-2"
            />
            <h3 className="font-semibold mb-2">{show.title}</h3>
            <button
              onClick={() => handleAddToWatchlist(show.id)}
              disabled={addedShows.has(show.id)}
              className="mt-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addedShows.has(show.id) ? 'Added to Watchlist' : 'Add to Watchlist'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 