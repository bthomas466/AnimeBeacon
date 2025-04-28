import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for managing watchlist operations
 * @returns {Object} Watchlist state and handlers
 */
const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWatchlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/watchlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setWatchlist(response.data.watchlist);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToWatchlist = useCallback(async (showId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/watchlist', 
        { showId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setWatchlist(prev => [...prev, response.data.watchListEntry]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to watchlist');
      console.error('Error adding to watchlist:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isInWatchlist = useCallback((showId) => {
    return watchlist.some(entry => entry.showId === showId);
  }, [watchlist]);

  return {
    watchlist,
    isLoading,
    error,
    fetchWatchlist,
    addToWatchlist,
    isInWatchlist
  };
};

export default useWatchlist; 