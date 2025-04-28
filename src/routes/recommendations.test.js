const request = require('supertest');
const app = require('../server');
const { prisma } = require('../db');
const { fetchRecommendations } = require('../services/anilist');

// Mock Prisma
jest.mock('../db', () => ({
  prisma: {
    watchList: {
      findMany: jest.fn(),
    },
  },
}));

// Mock AniList service
jest.mock('../services/anilist', () => ({
  fetchRecommendations: jest.fn(),
}));

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { id: 'user-123' };
      next();
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  },
}));

describe('Recommendations Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /recommendations/basic', () => {
    const mockWatchList = [
      {
        userId: 'user-123',
        showId: 'show-1',
        rating: 5,
        show: {
          id: 'show-1',
          externalId: '101',
          title: 'Action Anime',
          genres: ['Action', 'Adventure']
        }
      },
      {
        userId: 'user-123',
        showId: 'show-2',
        rating: 4,
        show: {
          id: 'show-2',
          externalId: '102',
          title: 'Fantasy Anime',
          genres: ['Fantasy', 'Adventure']
        }
      }
    ];

    const mockRecommendations = [
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

    it('returns recommendations based on user watch history', async () => {
      prisma.watchList.findMany.mockResolvedValue(mockWatchList);
      fetchRecommendations.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .get('/recommendations/basic')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.recommendations).toHaveLength(2);
      expect(response.body.basedOn.genres).toContain('Adventure');
      expect(response.body.recommendations[0]).toEqual({
        title: 'New Action Anime',
        imageUrl: 'https://example.com/image1.jpg',
        synopsis: 'An exciting new anime',
        rating: 4.25,
        genres: ['Action', 'Adventure']
      });
    });

    it('handles users with no watch history', async () => {
      prisma.watchList.findMany.mockResolvedValue([]);
      fetchRecommendations.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .get('/recommendations/basic')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.basedOn.genres).toEqual(['Action', 'Adventure', 'Fantasy']);
      expect(response.body.basedOn.showCount).toBe(0);
    });

    it('requires authentication', async () => {
      const response = await request(app)
        .get('/recommendations/basic');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Not authenticated');
    });

    it('handles API errors gracefully', async () => {
      prisma.watchList.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/recommendations/basic')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get recommendations');
    });
  });
}); 