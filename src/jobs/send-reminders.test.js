const { PrismaClient } = require('@prisma/client');
const { sendReminders } = require('./send-reminders');
const { sendEpisodeReminder } = require('../services/email');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findMany: jest.fn(),
    },
    watchList: {
      findMany: jest.fn(),
    },
    episode: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

// Mock email service
jest.mock('../services/email', () => ({
  sendEpisodeReminder: jest.fn(),
}));

describe('send-reminders job', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    prisma.user.findMany.mockClear();
    prisma.watchList.findMany.mockClear();
    prisma.episode.findMany.mockClear();
    sendEpisodeReminder.mockClear();
  });

  it('should send reminders only to users who opted in', async () => {
    // Mock users
    const mockUsers = [
      {
        id: '1',
        email: 'opted-in@example.com',
        name: 'Opted In User',
        timezone: 'America/New_York',
        notificationOptIn: true,
      },
      {
        id: '2',
        email: 'opted-out@example.com',
        name: 'Opted Out User',
        timezone: 'America/New_York',
        notificationOptIn: false,
      },
    ];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    // Mock watchlist
    prisma.watchList.findMany.mockResolvedValue([
      {
        userId: '1',
        showId: '1',
        status: 'watching',
        show: {
          id: '1',
          title: 'Test Show',
        },
      },
    ]);

    // Mock episodes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    prisma.episode.findMany.mockResolvedValue([
      {
        id: 1,
        showId: '1',
        episodeNumber: 1,
        title: 'Episode 1',
        airDate: tomorrow,
        isSubbed: true,
        isDubbed: false,
        show: {
          id: '1',
          title: 'Test Show',
        },
      },
    ]);

    // Run the job
    await sendReminders();

    // Verify that email was only sent to opted-in user
    expect(sendEpisodeReminder).toHaveBeenCalledTimes(1);
    expect(sendEpisodeReminder).toHaveBeenCalledWith(
      mockUsers[0],
      expect.arrayContaining([
        expect.objectContaining({
          episodeNumber: 1,
          title: 'Episode 1',
        }),
      ])
    );
  });

  it('should not send reminders if user has no episodes tomorrow', async () => {
    // Mock opted-in user
    const mockUsers = [
      {
        id: '1',
        email: 'opted-in@example.com',
        name: 'Opted In User',
        timezone: 'America/New_York',
        notificationOptIn: true,
      },
    ];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    // Mock empty watchlist
    prisma.watchList.findMany.mockResolvedValue([]);

    // Mock no episodes
    prisma.episode.findMany.mockResolvedValue([]);

    // Run the job
    await sendReminders();

    // Verify that no email was sent
    expect(sendEpisodeReminder).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully for individual users', async () => {
    // Mock users
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User 1',
        timezone: 'America/New_York',
        notificationOptIn: true,
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'User 2',
        timezone: 'America/New_York',
        notificationOptIn: true,
      },
    ];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    // Mock watchlist for first user
    prisma.watchList.findMany
      .mockResolvedValueOnce([
        {
          userId: '1',
          showId: '1',
          status: 'watching',
          show: {
            id: '1',
            title: 'Test Show 1',
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          userId: '2',
          showId: '2',
          status: 'watching',
          show: {
            id: '2',
            title: 'Test Show 2',
          },
        },
      ]);

    // Mock episodes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    prisma.episode.findMany
      .mockResolvedValueOnce([
        {
          id: 1,
          showId: '1',
          episodeNumber: 1,
          title: 'Episode 1',
          airDate: tomorrow,
          isSubbed: true,
          isDubbed: false,
          show: {
            id: '1',
            title: 'Test Show 1',
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 2,
          showId: '2',
          episodeNumber: 1,
          title: 'Episode 1',
          airDate: tomorrow,
          isSubbed: true,
          isDubbed: false,
          show: {
            id: '2',
            title: 'Test Show 2',
          },
        },
      ]);

    // Mock email service to fail for first user
    sendEpisodeReminder
      .mockRejectedValueOnce(new Error('Failed to send email'))
      .mockResolvedValueOnce();

    // Run the job
    await sendReminders();

    // Verify that email was attempted for both users
    expect(sendEpisodeReminder).toHaveBeenCalledTimes(2);
  });
}); 