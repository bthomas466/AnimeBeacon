import { useState } from 'react';
import axios from 'axios';

/**
 * Hook for managing show ratings
 * @param {string} showId - ID of the show to rate
 * @param {number} initialRating - Initial rating value
 * @returns {Object} Rating state and handlers
 */
const useRating = (showId, initialRating = 0) => {
  const [rating, setRating] = useState(initialRating);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateRating = async (newRating) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/watchlist/${showId}/rate`, {
        rating: newRating
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setRating(response.data.watchListEntry.rating);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update rating');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rating,
    isLoading,
    error,
    updateRating
  };
};

export default useRating; 