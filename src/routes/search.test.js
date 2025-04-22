const request = require('supertest');
const app = require('../server');
const fetch = require('node-fetch');

// Mock node-fetch
jest.mock('node-fetch');

describe('Search Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns search results from AniList', async () => {
    // Mock AniList API response
    const mockAniListResponse = {
      data: {
        Page: {
          media: [
            {
              id: 1,
              idMal: 101,
              title: {
                romaji: 'Test Anime',
                english: 'Test Anime',
                native: 'テストアニメ',
                userPreferred: 'Test Anime'
              },
              coverImage: {
                large: 'https://example.com/large.jpg',
                medium: 'https://example.com/medium.jpg'
              },
              status: 'RELEASING',
              episodes: 12,
              genres: ['Action', 'Adventure'],
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
              nextAiringEpisode: {
                airingAt: 1672531200,
                timeUntilAiring: 86400,
                episode: 5
              }
            }
          ]
        }
      }
    };

    // Mock fetch implementation
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAniListResponse)
      })
    );

    // Make request to our search endpoint
    const response = await request(app)
      .get('/search')
      .query({ q: 'test' });

    // Check response
    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0].title).toBe('Test Anime');
    expect(response.body.results[0].id).toBe(1);
    expect(response.body.results[0].malId).toBe(101);
    expect(response.body.results[0].coverImage).toBe('https://example.com/large.jpg');
    expect(response.body.results[0].status).toBe('RELEASING');
    expect(response.body.results[0].episodes).toBe(12);
    expect(response.body.results[0].genres).toEqual(['Action', 'Adventure']);
    expect(response.body.results[0].startDate).toEqual({
      year: 2023,
      month: 1,
      day: 1
    });
    expect(response.body.results[0].endDate).toEqual({
      year: 2023,
      month: 3,
      day: 31
    });
    expect(response.body.results[0].nextAiringEpisode).toEqual({
      airingAt: 1672531200,
      timeUntilAiring: 86400,
      episode: 5
    });

    // Verify fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      'https://graphql.anilist.co',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: expect.stringContaining('test')
      })
    );
  });

  it('handles empty query gracefully', async () => {
    // Make request with empty query
    const response = await request(app)
      .get('/search')
      .query({ q: '' });

    // Check response
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Search query is required');
    expect(response.body.results).toEqual([]);

    // Verify fetch was not called
    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles missing query parameter gracefully', async () => {
    // Make request without query parameter
    const response = await request(app)
      .get('/search');

    // Check response
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Search query is required');
    expect(response.body.results).toEqual([]);

    // Verify fetch was not called
    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles AniList API errors gracefully', async () => {
    // Mock fetch to simulate API error
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    // Make request to our search endpoint
    const response = await request(app)
      .get('/search')
      .query({ q: 'test' });

    // Check response
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to search for anime titles');
    expect(response.body.message).toBe('AniList API responded with status: 500');

    // Verify fetch was called
    expect(fetch).toHaveBeenCalled();
  });
}); 