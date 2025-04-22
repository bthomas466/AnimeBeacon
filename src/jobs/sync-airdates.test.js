const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const { syncEpisodes } = require('./sync-airdates');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    show: {
      findMany: jest.fn(),
    },
    episode: {
      upsert: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

// Mock node-fetch
jest.mock('node-fetch');

describe('sync-airdates job', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    fetch.mockClear();
    prisma.show.findMany.mockClear();
    prisma.episode.upsert.mockClear();
  });

  it('should add new episodes as they are announced', async () => {
    // Mock shows in database
    const mockShows = [
      {
        id: 1,
        aniListId: 123,
        title: 'Test Show',
      },
    ];
    prisma.show.findMany.mockResolvedValue(mockShows);

    // Mock AniList API response
    const mockEpisodes = [
      {
        number: 1,
        title: 'Episode 1',
        airDate: '2024-01-01',
        isSubbed: true,
        isDubbed: false,
      },
      {
        number: 2,
        title: 'Episode 2',
        airDate: '2024-01-08',
        isSubbed: true,
        isDubbed: true,
      },
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            Media: {
              episodes: mockEpisodes,
            },
          },
        }),
      })
    );

    // Run the sync
    await syncEpisodes();

    // Verify that upsert was called for each episode
    expect(prisma.episode.upsert).toHaveBeenCalledTimes(2);

    // Verify first episode
    expect(prisma.episode.upsert).toHaveBeenCalledWith({
      where: {
        showId_episodeNumber: {
          showId: 1,
          episodeNumber: 1,
        },
      },
      update: {
        title: 'Episode 1',
        airDate: new Date('2024-01-01'),
        isSubbed: true,
        isDubbed: false,
      },
      create: {
        showId: 1,
        episodeNumber: 1,
        title: 'Episode 1',
        airDate: new Date('2024-01-01'),
        isSubbed: true,
        isDubbed: false,
      },
    });

    // Verify second episode
    expect(prisma.episode.upsert).toHaveBeenCalledWith({
      where: {
        showId_episodeNumber: {
          showId: 1,
          episodeNumber: 2,
        },
      },
      update: {
        title: 'Episode 2',
        airDate: new Date('2024-01-08'),
        isSubbed: true,
        isDubbed: true,
      },
      create: {
        showId: 1,
        episodeNumber: 2,
        title: 'Episode 2',
        airDate: new Date('2024-01-08'),
        isSubbed: true,
        isDubbed: true,
      },
    });
  });

  it('should not create duplicate episodes', async () => {
    // Mock shows in database
    const mockShows = [
      {
        id: 1,
        aniListId: 123,
        title: 'Test Show',
      },
    ];
    prisma.show.findMany.mockResolvedValue(mockShows);

    // Mock AniList API response with duplicate episode numbers
    const mockEpisodes = [
      {
        number: 1,
        title: 'Episode 1',
        airDate: '2024-01-01',
        isSubbed: true,
        isDubbed: false,
      },
      {
        number: 1, // Duplicate episode number
        title: 'Episode 1 (Duplicate)',
        airDate: '2024-01-01',
        isSubbed: true,
        isDubbed: false,
      },
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            Media: {
              episodes: mockEpisodes,
            },
          },
        }),
      })
    );

    // Run the sync
    await syncEpisodes();

    // Verify that upsert was called only once for episode 1
    expect(prisma.episode.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.episode.upsert).toHaveBeenCalledWith({
      where: {
        showId_episodeNumber: {
          showId: 1,
          episodeNumber: 1,
        },
      },
      update: {
        title: 'Episode 1',
        airDate: new Date('2024-01-01'),
        isSubbed: true,
        isDubbed: false,
      },
      create: {
        showId: 1,
        episodeNumber: 1,
        title: 'Episode 1',
        airDate: new Date('2024-01-01'),
        isSubbed: true,
        isDubbed: false,
      },
    });
  });

  it('should skip episodes without air dates', async () => {
    // Mock shows in database
    const mockShows = [
      {
        id: 1,
        aniListId: 123,
        title: 'Test Show',
      },
    ];
    prisma.show.findMany.mockResolvedValue(mockShows);

    // Mock AniList API response with an episode without air date
    const mockEpisodes = [
      {
        number: 1,
        title: 'Episode 1',
        airDate: '2024-01-01',
        isSubbed: true,
        isDubbed: false,
      },
      {
        number: 2,
        title: 'Episode 2',
        airDate: null, // No air date
        isSubbed: true,
        isDubbed: true,
      },
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            Media: {
              episodes: mockEpisodes,
            },
          },
        }),
      })
    );

    // Run the sync
    await syncEpisodes();

    // Verify that upsert was called only for the episode with air date
    expect(prisma.episode.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.episode.upsert).toHaveBeenCalledWith({
      where: {
        showId_episodeNumber: {
          showId: 1,
          episodeNumber: 1,
        },
      },
      update: {
        title: 'Episode 1',
        airDate: new Date('2024-01-01'),
        isSubbed: true,
        isDubbed: false,
      },
      create: {
        showId: 1,
        episodeNumber: 1,
        title: 'Episode 1',
        airDate: new Date('2024-01-01'),
        isSubbed: true,
        isDubbed: false,
      },
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock shows in database
    const mockShows = [
      {
        id: 1,
        aniListId: 123,
        title: 'Test Show',
      },
    ];
    prisma.show.findMany.mockResolvedValue(mockShows);

    // Mock API error
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    // Run the sync
    await syncEpisodes();

    // Verify that no episodes were upserted
    expect(prisma.episode.upsert).not.toHaveBeenCalled();
  });
}); 