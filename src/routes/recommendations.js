const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { PrismaClient } = require('../generated/prisma');
const { fetchRecommendations } = require('../services/anilist');

const prisma = new PrismaClient();

/**
 * Get basic recommendations based on user's top genres
 * @route GET /recommendations/basic
 */
router.get('/basic', isAuthenticated, async (req, res) => {
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

    // Get shows from AniList with these genres
    const recommendations = await fetchRecommendations(topGenres);

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

module.exports = router; 