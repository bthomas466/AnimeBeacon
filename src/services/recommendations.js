const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Placeholder weights for different factors
const WEIGHTS = {
  GENRE_MATCH: 0.4,
  RATING: 0.3,
  RECENCY: 0.2,
  POPULARITY: 0.1
};

/**
 * Calculate genre similarity score between two shows
 * @param {string[]} genres1 - First show's genres
 * @param {string[]} genres2 - Second show's genres
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateGenreSimilarity(genres1, genres2) {
  if (!genres1 || !genres2) return 0;
  const set1 = new Set(genres1);
  const set2 = new Set(genres2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Calculate recency score based on watch dates
 * @param {Date[]} watchDates - Array of watch dates
 * @returns {number} - Recency score between 0 and 1
 */
function calculateRecencyScore(watchDates) {
  if (!watchDates || !watchDates.length) return 0.5; // Default score if no history
  
  const now = new Date();
  const mostRecent = new Date(Math.max(...watchDates.map(d => new Date(d))));
  const daysSinceLastWatch = (now - mostRecent) / (1000 * 60 * 60 * 24);
  
  // Score decreases as days increase, max 30 days
  return Math.max(0, 1 - (daysSinceLastWatch / 30));
}

/**
 * Get advanced recommendations based on user history
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Promise<Object>} - Recommendations and metadata
 */
async function getAdvancedRecommendations(userId, limit = 10) {
  try {
    console.log(`Getting recommendations for user ${userId} with limit ${limit}`);

    // Get user's watch history with ratings and dates
    const userHistory = await prisma.watchList.findMany({
      where: {
        userId,
        NOT: { status: 'dropped' } // Exclude dropped shows
      },
      include: {
        show: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`Found ${userHistory.length} shows in user's history`);

    // Extract watch dates and ratings
    const watchDates = userHistory.map(entry => entry.updatedAt);
    const ratings = userHistory
      .filter(entry => entry.rating)
      .map(entry => entry.rating);
    
    // Calculate average rating and recency score
    const avgRating = ratings.length 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 3; // Default to middle rating if no ratings
    const recencyScore = calculateRecencyScore(watchDates);

    console.log(`Average rating: ${avgRating}, Recency score: ${recencyScore}`);

    // Get all shows not in user's watchlist
    const userShowIds = new Set(userHistory.map(entry => entry.showId));
    const candidateShows = await prisma.show.findMany({
      where: {
        id: { notIn: Array.from(userShowIds) }
      }
    });

    console.log(`Found ${candidateShows.length} candidate shows`);

    // Calculate scores for each candidate show
    const scoredShows = candidateShows.map(show => {
      // Genre similarity with user's watched shows
      const genreScores = userHistory.map(entry => 
        calculateGenreSimilarity(show.genres || [], entry.show.genres || [])
      );
      const genreScore = genreScores.length 
        ? genreScores.reduce((a, b) => a + b, 0) / genreScores.length 
        : 0;

      // Normalize rating to 0-1 scale
      const ratingScore = show.avgRating ? show.avgRating / 5 : 0.5;

      // Calculate final score using weights
      const score = 
        genreScore * WEIGHTS.GENRE_MATCH +
        ratingScore * WEIGHTS.RATING +
        recencyScore * WEIGHTS.RECENCY +
        (show.avgRating ? show.avgRating / 100 : 0.5) * WEIGHTS.POPULARITY;

      return {
        ...show,
        score,
        matchFactors: {
          genreMatch: genreScore,
          rating: ratingScore,
          recency: recencyScore,
          popularity: show.avgRating ? show.avgRating / 100 : 0.5
        }
      };
    });

    // Sort by score and take top N
    const recommendations = scoredShows
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, matchFactors, ...show }) => ({
        ...show,
        matchScore: score,
        matchFactors
      }));

    console.log(`Returning ${recommendations.length} recommendations`);

    return {
      recommendations,
      metadata: {
        basedOn: {
          showCount: userHistory.length,
          averageRating: avgRating,
          recencyScore,
          topGenres: Array.from(new Set(
            userHistory.flatMap(entry => entry.show.genres || [])
          )).slice(0, 5)
        }
      }
    };
  } catch (error) {
    console.error('Error in getAdvancedRecommendations:', error);
    throw error;
  }
}

module.exports = {
  getAdvancedRecommendations
}; 