const request = require('supertest');
const express = require('express');
const { prisma } = require('../db');
const showsRouter = require('./shows');
const { authenticateToken } = require('../middleware/auth');
const app = require('../app');
const WatchmodeService = require('../services/watchmode');

// Mock node-fetch
jest.mock('node-fetch');

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

// Mock Prisma
jest.mock('../db', () => ({
  prisma: {
    show: {
      findUnique: jest.fn()
    }
  }
}));

const app = express();
app.use(express.json());
app.use('/api/shows', showsRouter);

describe('GET /shows/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAniListResponse = {
    data: {
      Media: {
        id: 1,
        title: {
          romaji: 'Test Anime',
          english: 'Test Anime',
          native: 'テストアニメ'
        },
        description: 'Test synopsis',
        coverImage: {
          large: 'https://example.com/image.jpg'
        },
        episodes: 12,
        status: 'FINISHED',
        startDate: {
          year: 2023,
          month: 1,
          day: 1
        },
        endDate: {
          year: 2023,
          month: 3,
          day: 31
        },
        episodes: {
          nodes: [
            {
              id: 1,
              number: 1,
              title: 'Episode 1',
              airDate: {
                year: 2023,
                month: 1,
                day: 1
              }
            },
            {
              id: 2,
              number: 2,
              title: 'Episode 2',
              airDate: {
                year: 2023,
                month: 1,
                day: 8
              }
            }
          ]
        }
      }
    }
  };

  const mockLocalShow = {
    id: 1,
    episodes: [
      {
        number: 1,
        watched: true,
        subWatched: true,
        dubWatched: false
      },
      {
        number: 2,
        watched: false,
        subWatched: false,
        dubWatched: false
      }
    ]
  };

  it('returns show details with local episode tracking', async () => {
    // Mock AniList API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAniListResponse)
    });

    // Mock Prisma response
    prisma.show.findUnique.mockResolvedValue(mockLocalShow);

    const response = await request(app)
      .get('/api/shows/1')
      .expect(200);

    expect(response.body).toEqual({
      id: 1,
      title: {
        romaji: 'Test Anime',
        english: 'Test Anime',
        native: 'テストアニメ'
      },
      synopsis: 'Test synopsis',
      coverImage: 'https://example.com/image.jpg',
      episodeCount: 12,
      status: 'finished',
      episodes: [
        {
          id: 1,
          number: 1,
          title: 'Episode 1',
          airDate: '2023-01-01T00:00:00.000Z',
          watched: true,
          subWatched: true,
          dubWatched: false
        },
        {
          id: 2,
          number: 2,
          title: 'Episode 2',
          airDate: '2023-01-08T00:00:00.000Z',
          watched: false,
          subWatched: false,
          dubWatched: false
        }
      ],
      platforms: []
    });
  });

  it('returns 404 if show not found in AniList', async () => {
    // Mock AniList API response for non-existent show
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { Media: null } })
    });

    await request(app)
      .get('/api/shows/999')
      .expect(404)
      .expect({ error: 'Show not found' });
  });

  it('returns 400 for invalid show ID', async () => {
    await request(app)
      .get('/api/shows/invalid')
      .expect(400)
      .expect({ error: 'Invalid show ID' });
  });

  it('handles AniList API errors', async () => {
    // Mock AniList API error
    global.fetch = jest.fn().mockResolvedValue({
      ok: false
    });

    await request(app)
      .get('/api/shows/1')
      .expect(404)
      .expect({ error: 'Show not found' });
  });

  it('handles missing local episode tracking data', async () => {
    // Mock AniList API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAniListResponse)
    });

    // Mock Prisma response with no local data
    prisma.show.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/shows/1')
      .expect(200);

    // Verify episodes have default tracking values
    expect(response.body.episodes[0]).toEqual({
      id: 1,
      number: 1,
      title: 'Episode 1',
      airDate: '2023-01-01T00:00:00.000Z',
      watched: false,
      subWatched: false,
      dubWatched: false
    });
  });

  it('correctly determines airing status', async () => {
    // Mock AniList API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAniListResponse)
    });

    // Mock Prisma response
    prisma.show.findUnique.mockResolvedValue(mockLocalShow);

    const response = await request(app)
      .get('/api/shows/1')
      .expect(200);

    expect(response.body.status).toBe('finished');
  });
});

describe('Shows Routes', () => {
  beforeEach(() => {
    WatchmodeService.mockClear();
  });

  describe('GET /shows/:id', () => {
    it('should return show details with streaming platforms', async () => {
      const mockShow = {
        id: 1,
        title: 'Test Show',
        coverImage: 'https://example.com/image.jpg',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const mockPlatforms = [
        {
          name: 'Netflix',
          logo: 'https://logo.clearbit.com/netflix.com',
          url: 'https://netflix.com/watch/123',
          hasSub: true,
          hasDub: false,
          isPrimary: true
        }
      ];

      const mockWatchmode = {
        getShowDetails: jest.fn().mockResolvedValue(mockPlatforms)
      };

      WatchmodeService.mockImplementation(() => mockWatchmode);

      const response = await request(app)
        .get('/api/shows/1')
        .expect(200);

      expect(response.body).toEqual({
        ...mockShow,
        platforms: mockPlatforms
      });
      expect(mockWatchmode.getShowDetails).toHaveBeenCalledWith(1);
    });

    it('should handle shows not found', async () => {
      const mockWatchmode = {
        getShowDetails: jest.fn().mockRejectedValue(new Error('Show not found'))
      };

      WatchmodeService.mockImplementation(() => mockWatchmode);

      await request(app)
        .get('/api/shows/999')
        .expect(404);
    });

    it('should handle Watchmode API errors gracefully', async () => {
      const mockShow = {
        id: 1,
        title: 'Test Show',
        coverImage: 'https://example.com/image.jpg',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const mockWatchmode = {
        getShowDetails: jest.fn().mockRejectedValue(new Error('Watchmode API error'))
      };

      WatchmodeService.mockImplementation(() => mockWatchmode);

      const response = await request(app)
        .get('/api/shows/1')
        .expect(200);

      expect(response.body).toEqual({
        ...mockShow,
        platforms: []
      });
    });
  });
}); 