const request = require('supertest');
const express = require('express');
const { prisma } = require('../db');
const userRoutes = require('./users');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Mock Prisma
jest.mock('../db', () => ({
  prisma: {
    user: {
      update: jest.fn()
    }
  }
}));

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { id: '123' };
      next();
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }
}));

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', userRoutes);
    jest.clearAllMocks();
  });

  describe('POST /users/preferences', () => {
    const validPreferences = {
      language: 'es',
      timezone: 'America/New_York',
      notificationOptIn: true
    };

    it('should update preferences for authenticated user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        ...validPreferences
      };

      prisma.user.update.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/preferences')
        .set('Authorization', 'Bearer valid-token')
        .send(validPreferences);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: validPreferences,
        select: {
          id: true,
          email: true,
          name: true,
          language: true,
          timezone: true,
          notificationOptIn: true,
        }
      });
    });

    it('should reject unauthenticated access', async () => {
      const response = await request(app)
        .post('/users/preferences')
        .send(validPreferences);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should validate input data', async () => {
      const invalidPreferences = {
        language: 'toolong',
        timezone: '',
        notificationOptIn: 'not-a-boolean'
      };

      const response = await request(app)
        .post('/users/preferences')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidPreferences);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid input');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});

describe('User Settings Routes', () => {
  let mockUser;
  let token;

  beforeEach(() => {
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      notificationOptIn: true,
      googleCalendarId: 'test@example.com',
      googleTokenExpiry: new Date(Date.now() + 3600000),
    };

    token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET);

    PrismaClient.mockImplementation(() => ({
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
    }));
  });

  describe('GET /api/users/settings', () => {
    it('returns user settings', async () => {
      const response = await request(app)
        .get('/api/users/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        emailNotifications: true,
        calendarSync: {
          isConnected: true,
          isTokenValid: true,
        },
      });
    });

    it('returns 401 without token', async () => {
      const response = await request(app).get('/api/users/settings');

      expect(response.status).toBe(401);
    });

    it('handles database errors', async () => {
      PrismaClient.mockImplementation(() => ({
        user: {
          findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/users/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch user settings' });
    });
  });

  describe('PUT /api/users/settings', () => {
    it('updates email notifications', async () => {
      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ emailNotifications: false });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        emailNotifications: false,
        calendarSync: {
          isConnected: true,
          isTokenValid: true,
        },
      });
    });

    it('returns 401 without token', async () => {
      const response = await request(app)
        .put('/api/users/settings')
        .send({ emailNotifications: false });

      expect(response.status).toBe(401);
    });

    it('handles database errors', async () => {
      PrismaClient.mockImplementation(() => ({
        user: {
          update: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ emailNotifications: false });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update user settings' });
    });
  });
}); 