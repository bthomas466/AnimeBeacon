const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../server');

const prisma = new PrismaClient();

describe('Development Endpoints', () => {
  let testUser;
  let testShow;
  let testEpisode;

  beforeAll(async () => {
    // Create test data
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        timezone: 'America/New_York',
        notificationPreferences: {
          create: {
            enabled: true
          }
        }
      }
    });

    testShow = await prisma.show.create({
      data: {
        title: 'Test Anime',
        imageUrl: 'https://example.com/image.jpg',
        genres: ['Action', 'Adventure']
      }
    });

    // Add show to user's watchlist
    await prisma.watchList.create({
      data: {
        userId: testUser.id,
        showId: testShow.id,
        status: 'watching'
      }
    });

    // Create tomorrow's episode
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0); // 3 PM

    testEpisode = await prisma.episode.create({
      data: {
        showId: testShow.id,
        episodeNumber: 1,
        title: 'Test Episode',
        airDate: tomorrow,
        isSubbed: true,
        isDubbed: false
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.episode.deleteMany({
      where: { showId: testShow.id }
    });
    await prisma.watchList.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.show.delete({
      where: { id: testShow.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    await prisma.$disconnect();
  });

  describe('POST /dev/simulate-reminder', () => {
    it('should simulate reminder for valid user with upcoming episodes', async () => {
      const response = await request(app)
        .post('/dev/simulate-reminder')
        .send({ userId: testUser.id });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reminder simulated successfully');
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.episodes['Test Anime']).toHaveLength(1);
      expect(response.body.episodes['Test Anime'][0].episodeNumber).toBe(1);
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/dev/simulate-reminder')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    it('should return 404 for invalid user ID', async () => {
      const response = await request(app)
        .post('/dev/simulate-reminder')
        .send({ userId: 'invalid-id' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle users with no upcoming episodes', async () => {
      // Create a user with no episodes
      const userWithoutEpisodes = await prisma.user.create({
        data: {
          email: 'no-episodes@example.com',
          password: 'hashedpassword',
          timezone: 'UTC'
        }
      });

      const response = await request(app)
        .post('/dev/simulate-reminder')
        .send({ userId: userWithoutEpisodes.id });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('No episodes found for tomorrow');

      // Clean up
      await prisma.user.delete({
        where: { id: userWithoutEpisodes.id }
      });
    });
  });
}); 