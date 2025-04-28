import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import Rating from './Rating';
import useRating from '../hooks/useRating';

/**
 * Component for displaying detailed show information
 * @param {Object} props
 * @param {Object} props.show - Show data
 * @param {string} props.show.id - Show ID
 * @param {string} props.show.title - Show title
 * @param {string} props.show.imageUrl - Show image URL
 * @param {string[]} props.show.genres - Show genres
 * @param {string} props.show.description - Show description
 * @param {number} props.show.rating - User's rating (if any)
 * @param {function} props.onRatingChange - Callback when rating changes
 */
const ShowDetails = ({ show, onRatingChange }) => {
  const { rating, isLoading, updateRating } = useRating(show.id, show.rating);

  const handleRatingChange = async (newRating) => {
    try {
      await updateRating(newRating);
      if (onRatingChange) {
        onRatingChange(newRating);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box
            component="img"
            src={show.imageUrl || '/placeholder.jpg'}
            alt={show.title}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 1,
              boxShadow: 2
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            {show.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
            {show.genres?.map((genre) => (
              <Chip 
                key={genre} 
                label={genre} 
                variant="outlined" 
              />
            ))}
          </Stack>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Rating
            </Typography>
            <Rating
              value={rating}
              onChange={handleRatingChange}
              size="large"
              readOnly={isLoading}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {show.description}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ShowDetails; 