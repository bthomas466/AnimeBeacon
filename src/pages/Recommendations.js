import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import ShowCard from '../components/ShowCard';
import useRecommendations from '../hooks/useRecommendations';
import useWatchlist from '../hooks/useWatchlist';

/**
 * Recommendations page component with tabs for different recommendation types
 */
const Recommendations = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { 
    recommendations, 
    isLoading, 
    error,
    hasRatings,
    fetchRecommendations 
  } = useRecommendations();
  const { addToWatchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    // Fetch recommendations when tab changes
    fetchRecommendations(activeTab === 0 ? 'advanced' : 'basic');
  }, [activeTab, fetchRecommendations]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddToWatchlist = async (show) => {
    try {
      await addToWatchlist(show.id);
    } catch (error) {
      console.error('Failed to add show to watchlist:', error);
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const renderNoRatingsMessage = () => (
    <Paper 
      sx={{ 
        p: 4, 
        textAlign: 'center',
        backgroundColor: 'background.default'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Rate a few shows to unlock recommendations!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Start rating shows you've watched to get personalized recommendations.
      </Typography>
    </Paper>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!hasRatings && activeTab === 1) {
      return renderNoRatingsMessage();
    }

    if (recommendations.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">
            No recommendations available at this time.
          </Typography>
        </Paper>
      );
    }

    return (
      <Grid container spacing={3}>
        {recommendations.map((show) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={show.id}>
            <ShowCard
              show={show}
              onAddToWatchlist={() => handleAddToWatchlist(show)}
              showAddButton={!isInWatchlist(show.id)}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recommendations
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab label="For You" />
        <Tab label="Based on Your Genres" />
      </Tabs>

      {renderContent()}
    </Box>
  );
};

export default Recommendations; 