const express = require('express');
const { PrismaClient } = require('./src/generated/prisma');
const fetch = require('node-fetch');
const { getAdvancedRecommendations } = require('./src/services/recommendations');

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(express.json());

// Mock authentication middleware for testing
const isAuthenticated = (req, res, next) => {
  if (req.headers.authorization === 'Bearer valid-token') {
    req.user = { id: 'user-123' };
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Mock AniList recommendations
const mockAniListRecommendations = [
  {
    id: 201,
    title: {
      userPreferred: 'New Action Anime',
      english: 'New Action Anime EN',
      romaji: 'New Action Anime JP'
    },
    genres: ['Action', 'Adventure'],
    description: 'An exciting new anime',
    coverImage: {
      large: 'https://example.com/image1.jpg'
    },
    averageScore: 85
  },
  {
    id: 202,
    title: {
      userPreferred: 'New Fantasy Anime',
      english: 'New Fantasy Anime EN',
      romaji: 'New Fantasy Anime JP'
    },
    genres: ['Fantasy', 'Adventure'],
    description: 'A magical new anime',
    coverImage: {
      large: 'https://example.com/image2.jpg'
    },
    averageScore: 80
  }
];

// Get user's watchlist
app.get('/watchlist', isAuthenticated, async (req, res) => {
  try {
    const watchList = await prisma.watchList.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        show: true
      }
    });
    res.json(watchList);
  } catch (error) {
    console.error('Error getting watchlist:', error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
});

// Rating endpoint
app.post('/watchlist/:showId/rate', isAuthenticated, async (req, res) => {
  try {
    const { showId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be a number between 1 and 5' 
      });
    }

    // Check if show exists in user's watch list
    const existingEntry = await prisma.watchList.findFirst({
      where: {
        showId,
        userId
      }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Show not found in watch list' });
    }

    // Update the rating
    const updatedEntry = await prisma.watchList.update({
      where: {
        id: existingEntry.id
      },
      data: {
        rating
      },
      include: {
        show: true
      }
    });

    res.json({ watchListEntry: updatedEntry });
  } catch (error) {
    console.error('Error rating show:', error);
    res.status(500).json({ error: 'Failed to rate show' });
  }
});

// Basic recommendations endpoint
app.get('/recommendations/basic', isAuthenticated, async (req, res) => {
  try {
    // Get user's watched shows with ratings
    const userWatchList = await prisma.watchList.findMany({
      where: {
        userId: req.user.id,
        NOT: { rating: null }
      },
      include: {
        show: true
      }
    });

    // Extract all genres from watched shows
    const genreCounts = {};
    userWatchList.forEach(entry => {
      entry.show.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    // Sort genres by frequency and get top 3
    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    // If user has no watched shows with genres, use popular genres
    if (topGenres.length === 0) {
      topGenres.push('Action', 'Adventure', 'Fantasy');
    }

    // Use mock AniList recommendations
    const recommendations = mockAniListRecommendations;

    // Filter out shows already in user's watchlist
    const userShowIds = new Set(userWatchList.map(entry => entry.show.externalId));
    const filteredRecommendations = recommendations
      .filter(show => !userShowIds.has(String(show.id)))
      .map(show => ({
        title: show.title.userPreferred || show.title.english || show.title.romaji,
        imageUrl: show.coverImage?.large,
        synopsis: show.description,
        rating: show.averageScore ? show.averageScore / 20 : null, // Convert to 5-star scale
        genres: show.genres
      }))
      .slice(0, 10); // Return top 10 recommendations

    res.json({
      recommendations: filteredRecommendations,
      basedOn: {
        genres: topGenres,
        showCount: userWatchList.length
      }
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Advanced recommendations endpoint
app.get('/recommendations/advanced', isAuthenticated, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendations = await getAdvancedRecommendations(req.user.id, parseInt(limit));
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting advanced recommendations:', error);
    res.status(500).json({ error: 'Failed to get advanced recommendations' });
  }
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
}); 