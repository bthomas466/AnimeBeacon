const request = require('supertest');
const app = require('../server');
const { prisma } = require('../db');
const fetch = require('node-fetch');

// Mock node-fetch
jest.mock('node-fetch');

// Mock Prisma
jest.mock('../db', () => ({
  prisma: {
    show: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    watchList: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
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

describe('Watchlist Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /watchlist', () => {
    const mockShows = [
      {
        id: 'show-1',
        title: 'Test Anime 1',
        externalId: '101',
        platforms: ['crunchyroll'],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-03-31')
      },
      {
        id: 'show-2',
        title: 'Another Anime',
        externalId: '102',
        platforms: ['netflix'],
        startDate: new Date('2023-04-01'),
        endDate: null
      }
    ];

    const mockWatchList = [
      {
        id: 'watchlist-1',
        userId: 'user-123',
        showId: 'show-1',
        status: 'completed',
        show: {
          id: 'show-1',
          title: 'Test Anime 1',
          externalId: '101',
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-03-31T00:00:00.000Z',
          platforms: ['crunchyroll']
        }
      },
      {
        id: 'watchlist-2',
        userId: 'user-123',
        showId: 'show-2',
        status: 'watching',
        show: {
          id: 'show-2',
          title: 'Another Anime',
          externalId: '102',
          startDate: '2023-04-01T00:00:00.000Z',
          platforms: ['netflix']
        }
      }
    ];

    it('returns user watchlist when authenticated', async () => {
      prisma.watchList.findMany.mockResolvedValue(mockWatchList);

      const response = await request(app)
        .get('/watchlist')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.watchList).toEqual(mockWatchList);
      expect(prisma.watchList.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: undefined,
        include: {
          show: {
            select: {
              id: true,
              title: true,
              externalId: true,
              platforms: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });
    });

    it('filters by status correctly', async () => {
      prisma.watchList.findMany.mockResolvedValue([mockWatchList[1]]);

      const response = await request(app)
        .get('/watchlist?status=watching')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.watchList).toEqual([mockWatchList[1]]);
      expect(prisma.watchList.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          status: 'watching'
        },
        orderBy: undefined,
        include: {
          show: {
            select: {
              id: true,
              title: true,
              externalId: true,
              platforms: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });
    });

    it('filters by platform correctly', async () => {
      prisma.watchList.findMany.mockResolvedValue([mockWatchList[0]]);

      const response = await request(app)
        .get('/watchlist?platform=crunchyroll')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.watchList).toEqual([mockWatchList[0]]);
      expect(prisma.watchList.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          show: { platforms: { has: 'crunchyroll' } }
        },
        orderBy: undefined,
        include: {
          show: {
            select: {
              id: true,
              title: true,
              externalId: true,
              platforms: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });
    });

    it('sorts by title correctly', async () => {
      prisma.watchList.findMany.mockResolvedValue([mockWatchList[1], mockWatchList[0]]);

      const response = await request(app)
        .get('/watchlist?sort=title')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.watchList).toEqual([mockWatchList[1], mockWatchList[0]]);
      expect(prisma.watchList.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { show: { title: 'asc' } },
        include: {
          show: {
            select: {
              id: true,
              title: true,
              externalId: true,
              platforms: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });
    });

    it('sorts by airDate correctly', async () => {
      prisma.watchList.findMany.mockResolvedValue([mockWatchList[0], mockWatchList[1]]);

      const response = await request(app)
        .get('/watchlist?sort=airDate')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.watchList).toEqual([mockWatchList[0], mockWatchList[1]]);
      expect(prisma.watchList.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { show: { startDate: 'asc' } },
        include: {
          show: {
            select: {
              id: true,
              title: true,
              externalId: true,
              platforms: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });
    });

    it('combines filters and sorting correctly', async () => {
      prisma.watchList.findMany.mockResolvedValue([mockWatchList[1]]);

      const response = await request(app)
        .get('/watchlist?status=watching&platform=netflix&sort=title')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.watchList).toEqual([mockWatchList[1]]);
      expect(prisma.watchList.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          status: 'watching',
          show: { platforms: { has: 'netflix' } }
        },
        orderBy: { show: { title: 'asc' } },
        include: {
          show: {
            select: {
              id: true,
              title: true,
              externalId: true,
              platforms: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });
    });

    it('returns 400 for invalid status', async () => {
      const response = await request(app)
        .get('/watchlist?status=invalid')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
      expect(prisma.watchList.findMany).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid sort field', async () => {
      const response = await request(app)
        .get('/watchlist?sort=invalid')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid sort field');
      expect(prisma.watchList.findMany).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid platform', async () => {
      const response = await request(app)
        .get('/watchlist?platform=invalid')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid platform');
      expect(prisma.watchList.findMany).not.toHaveBeenCalled();
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/watchlist');

      expect(response.status).toBe(401);
      expect(prisma.watchList.findMany).not.toHaveBeenCalled();
    });

    test('GET /watchlist returns user watchlist sorted by air date', async () => {
      const response = await request(app)
        .get('/watchlist?sort=airDate')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [
          {
            id: 'watchlist-1',
            userId: 'user-123',
            showId: 'show-1',
            status: 'completed',
            show: {
              id: 'show-1',
              title: 'Test Anime 1',
              externalId: '101',
              startDate: '2023-01-01T00:00:00.000Z',
              endDate: '2023-03-31T00:00:00.000Z',
              platforms: ['crunchyroll']
            }
          },
          {
            id: 'watchlist-2',
            userId: 'user-123',
            showId: 'show-2',
            status: 'watching',
            show: {
              id: 'show-2',
              title: 'Another Anime',
              externalId: '102',
              startDate: '2023-04-01T00:00:00.000Z',
              platforms: ['netflix']
            }
          }
        ]
      });
    });
  });

  describe('POST /watchlist', () => {
    it('adds show to watchlist when authenticated', async () => {
      const mockShow = {
        id: 'show-1',
        title: 'Test Anime',
        externalId: '101',
        startDate: new Date('2023-01-01'),
        endDate: null
      };

      const mockWatchListEntry = {
        id: 'watchlist-1',
        userId: 'user-123',
        showId: 'show-1',
        status: 'watching',
        show: mockShow
      };

      // Mock show not existing in DB
      prisma.show.findFirst.mockResolvedValue(null);

      // Mock AniList API response
      fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              Media: {
                id: 1,
                idMal: 101,
                title: {
                  romaji: 'Test Anime',
                  english: 'Test Anime',
                  userPreferred: 'Test Anime'
                },
                startDate: {
                  year: 2023,
                  month: 1,
                  day: 1
                },
                endDate: null
              }
            }
          })
        })
      );

      // Mock show creation
      prisma.show.create.mockResolvedValue(mockShow);

      // Mock watchlist entry creation
      prisma.watchList.create.mockResolvedValue(mockWatchListEntry);

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', 'Bearer valid-token')
        .send({ showId: 1 });

      expect(response.status).toBe(201);
      expect(response.body.watchListEntry).toEqual(mockWatchListEntry);
      expect(prisma.show.create).toHaveBeenCalledWith({
        data: {
          id: '1',
          title: 'Test Anime',
          externalId: '101',
          platforms: [],
          startDate: new Date('2023-01-01')
        }
      });
      expect(prisma.watchList.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          showId: 'show-1',
          status: 'watching'
        },
        include: {
          show: true
        }
      });
    });

    it('returns 400 when showId is missing', async () => {
      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Show ID is required');
      expect(prisma.show.create).not.toHaveBeenCalled();
      expect(prisma.watchList.create).not.toHaveBeenCalled();
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/watchlist')
        .send({ showId: 1 });

      expect(response.status).toBe(401);
      expect(prisma.show.create).not.toHaveBeenCalled();
      expect(prisma.watchList.create).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /watchlist/:showId', () => {
    it('removes show from watchlist when authenticated', async () => {
      const mockWatchListEntry = {
        id: 'watchlist-1',
        userId: 'user-123',
        showId: 'show-1',
        status: 'watching'
      };

      prisma.watchList.findFirst.mockResolvedValue(mockWatchListEntry);
      prisma.watchList.delete.mockResolvedValue(mockWatchListEntry);

      const response = await request(app)
        .delete('/watchlist/show-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
      expect(prisma.watchList.findFirst).toHaveBeenCalledWith({
        where: {
          showId: 'show-1',
          userId: 'user-123'
        }
      });
      expect(prisma.watchList.delete).toHaveBeenCalledWith({
        where: {
          id: 'watchlist-1'
        }
      });
    });

    it('returns 404 when show is not in watchlist', async () => {
      prisma.watchList.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/watchlist/show-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Show not found in watch list');
      expect(prisma.watchList.delete).not.toHaveBeenCalled();
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete('/watchlist/show-1');

      expect(response.status).toBe(401);
      expect(prisma.watchList.findFirst).not.toHaveBeenCalled();
      expect(prisma.watchList.delete).not.toHaveBeenCalled();
    });
  });

  describe('POST /watchlist/:showId/rate', () => {
    const mockWatchListEntry = {
      id: 'watchlist-1',
      userId: 'user-123',
      showId: 'show-1',
      status: 'watching',
      rating: null,
      show: {
        id: 'show-1',
        title: 'Test Anime 1',
        externalId: '101'
      }
    };

    it('successfully rates a show', async () => {
      prisma.watchList.findFirst.mockResolvedValue(mockWatchListEntry);
      prisma.watchList.update.mockResolvedValue({
        ...mockWatchListEntry,
        rating: 5
      });

      const response = await request(app)
        .post('/watchlist/show-1/rate')
        .set('Authorization', 'Bearer valid-token')
        .send({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.watchListEntry.rating).toBe(5);
      expect(prisma.watchList.update).toHaveBeenCalledWith({
        where: { id: 'watchlist-1' },
        data: { rating: 5 },
        include: { show: true }
      });
    });

    it('rejects invalid rating values', async () => {
      const response = await request(app)
        .post('/watchlist/show-1/rate')
        .set('Authorization', 'Bearer valid-token')
        .send({ rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Rating must be a number between 1 and 5');
    });

    it('returns 404 if show not in watchlist', async () => {
      prisma.watchList.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/watchlist/show-1/rate')
        .set('Authorization', 'Bearer valid-token')
        .send({ rating: 5 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Show not found in watch list');
    });

    it('requires authentication', async () => {
      const response = await request(app)
        .post('/watchlist/show-1/rate')
        .send({ rating: 5 });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Not authenticated');
    });
  });
}); 