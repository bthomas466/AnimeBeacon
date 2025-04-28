import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for fetching show recommendations
 * @returns {Object} Recommendations state and handlers
 */
const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRatings, setHasRatings] = useState(false);

  const fetchRecommendations = useCallback(async (type = 'advanced') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/recommendations/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setRecommendations(response.data.recommendations);
      setHasRatings(response.data.hasRatings);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    hasRatings,
    fetchRecommendations
  };
};

export default useRecommendations; 