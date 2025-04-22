import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from '../components/SearchBar';
import { Link } from 'react-router-dom';

export default function WatchlistPage() {
  const { watchlist: contextWatchlist, refreshWatchlist } = useAuth();
  const [localWatchlist, setLocalWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    platform: ''
  });
  const [sort, setSort] = useState('');

  // Sync with context watchlist
  useEffect(() => {
    if (contextWatchlist) {
      setLocalWatchlist(contextWatchlist);
      setLoading(false);
    }
  }, [contextWatchlist]);

  const getAiringStatus = (startDate, endDate) => {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (!start) return 'not yet started';
    if (end && end < now) return 'finished';
    if (start > now) return 'not yet started';
    return 'airing';
  };

  const handleStatusUpdate = async (showId, newStatus) => {
    try {
      const response = await fetch(`/api/watchlist/${showId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setLocalWatchlist(prev => prev.map(item => 
        item.showId === showId 
          ? { ...item, status: newStatus }
          : item
      ));

      // Refresh watchlist from server to ensure sync
      await refreshWatchlist();
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      platform: ''
    });
    setSort('');
  };

  // Apply filters and sorting to local watchlist
  const filteredWatchlist = localWatchlist
    .filter(item => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.platform && !item.show.platforms.includes(filters.platform)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'title') {
        return a.show.title.localeCompare(b.show.title);
      }
      if (sort === 'airDate') {
        const dateA = new Date(a.show.startDate);
        const dateB = new Date(b.show.startDate);
        return dateA - dateB;
      }
      return 0;
    });

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Watchlist</h1>
      
      <SearchBar />

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
              Platform
            </label>
            <select
              id="platform"
              name="platform"
              value={filters.platform}
              onChange={handleFilterChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="netflix">Netflix</option>
              <option value="crunchyroll">Crunchyroll</option>
              <option value="funimation">Funimation</option>
              <option value="hidive">HIDIVE</option>
              <option value="amazon">Amazon</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              name="sort"
              value={sort}
              onChange={handleSortChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Default</option>
              <option value="airDate">Air Date</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>

        {(filters.status || filters.platform || sort) && (
          <button
            onClick={clearFilters}
            className="mt-6 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>
        )}
      </div>

      {filteredWatchlist.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No shows found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWatchlist.map((item) => {
            const airingStatus = getAiringStatus(item.show.startDate, item.show.endDate);
            const statusColors = {
              'airing': 'bg-green-100 text-green-800',
              'finished': 'bg-gray-100 text-gray-800',
              'not yet started': 'bg-blue-100 text-blue-800'
            };

            return (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                <Link to={`/show/${item.showId}`} className="block">
                  <img
                    src={item.show.coverImage || '/placeholder-cover.jpg'}
                    alt={item.show.title.english || item.show.title.romaji}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {item.show.title.english || item.show.title.romaji}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${statusColors[airingStatus]}`}>
                        {airingStatus.charAt(0).toUpperCase() + airingStatus.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.show.episodeCount} Episodes
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusUpdate(item.showId, 'completed');
                        }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm hover:bg-indigo-200"
                      >
                        Complete
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusUpdate(item.showId, 'dropped');
                        }}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200"
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ShowCard = ({ show }) => {
  const { user } = useAuth();
  const [isReminderOn, setIsReminderOn] = useState(user?.notificationPreferences?.enabled || false);
  const [isCalendarSynced, setIsCalendarSynced] = useState(user?.calendarPreferences?.enabled || false);
  const [nextEpisode, setNextEpisode] = useState(null);

  useEffect(() => {
    const fetchNextEpisode = async () => {
      try {
        const response = await fetch(`/api/shows/${show.id}/episodes/next`);
        if (response.ok) {
          const data = await response.json();
          setNextEpisode(data);
        }
      } catch (error) {
        console.error('Error fetching next episode:', error);
      }
    };

    fetchNextEpisode();
  }, [show.id]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img
        src={show.imageUrl}
        alt={show.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{show.title}</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {show.genres.map((genre) => (
            <span
              key={genre}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {genre}
            </span>
          ))}
        </div>
        {nextEpisode && (
          <div className="mb-2">
            <p className="text-sm text-gray-600">
              Next Episode: {new Date(nextEpisode.airDate).toLocaleDateString()}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          {isReminderOn && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
              Reminder On
            </span>
          )}
          {isCalendarSynced && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
              Calendar Synced
            </span>
          )}
        </div>
      </div>
    </div>
  );
}; 