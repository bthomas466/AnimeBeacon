import React, { useState, useEffect } from 'react';
import { Star, StarBorder, StarHalf } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';

/**
 * Interactive star rating component
 * @param {Object} props
 * @param {number} props.value - Current rating value (1-5)
 * @param {function} props.onChange - Callback when rating changes
 * @param {boolean} props.readOnly - Whether the rating is read-only
 * @param {string} props.size - Size of the stars ('small', 'medium', 'large')
 * @param {string} props.color - Color of the stars
 */
const Rating = ({ 
  value = 0, 
  onChange, 
  readOnly = false, 
  size = 'medium',
  color = 'primary'
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(value);

  // Update current value when prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleMouseEnter = (newValue) => {
    if (!readOnly) {
      setHoverValue(newValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const handleClick = (newValue) => {
    if (!readOnly && onChange) {
      onChange(newValue);
      setCurrentValue(newValue);
    }
  };

  const getStarIcon = (index) => {
    const displayValue = hoverValue || currentValue;
    const starValue = index + 1;

    if (displayValue >= starValue) {
      return <Star />;
    } else if (displayValue >= starValue - 0.5) {
      return <StarHalf />;
    } else {
      return <StarBorder />;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: '1rem' };
      case 'large':
        return { fontSize: '2rem' };
      default:
        return { fontSize: '1.5rem' };
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'inline-flex',
        alignItems: 'center'
      }}
    >
      {[1, 2, 3, 4, 5].map((starValue) => (
        <Tooltip 
          key={starValue} 
          title={readOnly ? `${currentValue} stars` : `Rate ${starValue} stars`}
        >
          <IconButton
            size="small"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            sx={{ 
              padding: '2px',
              color: color === 'primary' ? 'primary.main' : color
            }}
          >
            {getStarIcon(starValue - 1)}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

export default Rating; 