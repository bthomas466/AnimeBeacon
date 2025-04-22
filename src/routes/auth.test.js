const request = require('supertest');
const app = require('../server');
const prisma = require('../db');

// Mock strategies
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn(),
}));

jest.mock('passport-discord', () => ({
  Strategy: jest.fn(),
}));

jest.mock('passport-apple', () => ({
  Strategy: jest.fn(),
}));

// Mock prisma
jest.mock('../db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock passport
jest.mock('passport', () => {
  return {
    authenticate: jest.fn((strategy, options) => {
      return (req, res, next) => {
        // Simulate successful authentication
        req.user = {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          provider: strategy,
          providerId: `${strategy}-123`,
        };
        next();
      };
    }),
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
    serializeUser: jest.fn((fn) => fn),
    deserializeUser: jest.fn((fn) => fn),
  };
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Routes', () => {
    it.each([
      ['google', 'get'],
      ['discord', 'get'],
      ['apple', 'get'],
    ])('should redirect to %s OAuth when accessing /auth/%s', async (provider, method) => {
      const response = await request(app)[method](`/auth/${provider}`);
      expect(response.status).toBe(302);
    });

    it.each([
      ['google', 'get'],
      ['discord', 'get'],
      ['apple', 'post'],
    ])('should redirect to home after successful %s authentication', async (provider, method) => {
      const response = await request(app)[method](`/auth/${provider}/callback`);
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/');
    });
  });

  describe('User Management', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google',
      providerId: 'google-123',
    };

    beforeEach(() => {
      prisma.user.findUnique.mockReset();
      prisma.user.create.mockReset();
    });

    it('should return 401 when accessing /auth/current-user without authentication', async () => {
      const response = await request(app).get('/auth/current-user');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });

    it('should return user data when accessing /auth/current-user with authentication', async () => {
      // Mock authenticated user
      app.use((req, res, next) => {
        req.user = mockUser;
        next();
      });

      const response = await request(app).get('/auth/current-user');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should reuse existing user if providerId matches', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const response = await request(app).get('/auth/google/callback');
      expect(response.status).toBe(302);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create new user on first login', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce(mockUser);

      const response = await request(app).get('/auth/google/callback');
      expect(response.status).toBe(302);
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
}); 