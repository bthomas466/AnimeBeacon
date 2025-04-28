import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box,
  Button,
  Stack,
  Chip
} from '@mui/material';
import Rating from './Rating';
import useRating from '../hooks/useRating';

/**
 * Card component for displaying show information
 * @param {Object} props
 * @param {Object} props.show - Show data
 * @param {string} props.show.id - Show ID
 * @param {string} props.show.title - Show title
 * @param {string} props.show.imageUrl - Show image URL
 * @param {string[]} props.show.genres - Show genres
 * @param {string} props.show.description - Show description
 * @param {number} props.show.rating - User's rating (if any)
 * @param {function} props.onRatingChange - Callback when rating changes
 * @param {function} props.onAddToWatchlist - Callback when adding to watchlist
 * @param {boolean} props.showAddButton - Whether to show the add to watchlist button
 */
const ShowCard = ({ 
  show, 
  onRatingChange,
  onAddToWatchlist,
  showAddButton = false
}) => {
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
    <Card 
      sx={{ 
        maxWidth: 345,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={show.imageUrl || '/placeholder.jpg'}
        alt={show.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {show.title}
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
          {show.genres?.map((genre) => (
            <Chip 
              key={genre} 
              label={genre} 
              size="small" 
              variant="outlined" 
            />
          ))}
        </Stack>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {show.description}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your Rating:
          </Typography>
          <Rating
            value={rating}
            onChange={handleRatingChange}
            size="small"
            readOnly={isLoading}
          />
          
          {showAddButton && (
            <Button
              variant="contained"
              fullWidth
              onClick={() => onAddToWatchlist(show)}
              sx={{ mt: 2 }}
            >
              Add to Watchlist
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ShowCard; 