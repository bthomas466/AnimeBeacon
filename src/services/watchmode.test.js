const WatchmodeService = require('./watchmode');
const fetch = require('node-fetch');

jest.mock('node-fetch');

describe('WatchmodeService', () => {
  let watchmode;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    watchmode = new WatchmodeService(mockApiKey);
    fetch.mockClear();
  });

  describe('searchShow', () => {
    it('should search for a show by name', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          title_results: [{
            id: 123,
            name: 'Test Show',
            imdb_id: 'tt1234567'
          }]
        })
      };
      fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

      const result = await watchmode.searchShow('Test Show');
      expect(result).toEqual({
        id: 123,
        name: 'Test Show',
        imdb_id: 'tt1234567'
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': mockApiKey
          })
        })
      );
    });

    it('should handle API errors', async () => {
      fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 404
      }));

      await expect(watchmode.searchShow('Nonexistent Show')).rejects.toThrow('Failed to search show');
    });
  });

  describe('getShowDetails', () => {
    it('should fetch and format show details', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          title: 'Test Show',
          streaming_info: {
            us: {
              netflix: {
                type: 'sub',
                link: 'https://netflix.com/watch/123',
                leaving: 0
              },
              crunchyroll: {
                type: 'sub',
                link: 'https://crunchyroll.com/watch/456',
                leaving: 0
              }
            }
          }
        })
      };
      fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

      const result = await watchmode.getShowDetails(123);
      expect(result).toEqual([
        {
          name: 'Crunchyroll',
          logo: 'https://logo.clearbit.com/crunchyroll.com',
          url: 'https://crunchyroll.com/watch/456',
          hasSub: true,
          hasDub: false,
          isPrimary: true
        },
        {
          name: 'Netflix',
          logo: 'https://logo.clearbit.com/netflix.com',
          url: 'https://netflix.com/watch/123',
          hasSub: true,
          hasDub: false,
          isPrimary: false
        }
      ]);
    });

    it('should handle shows with no streaming info', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          title: 'Test Show',
          streaming_info: {}
        })
      };
      fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

      const result = await watchmode.getShowDetails(123);
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 404
      }));

      await expect(watchmode.getShowDetails(123)).rejects.toThrow('Failed to fetch show details');
    });

    it('should correctly identify primary platform based on priority', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          title: 'Test Show',
          streaming_info: {
            us: {
              netflix: {
                type: 'sub',
                link: 'https://netflix.com/watch/123',
                leaving: 0
              },
              crunchyroll: {
                type: 'sub',
                link: 'https://crunchyroll.com/watch/456',
                leaving: 0
              },
              funimation: {
                type: 'sub',
                link: 'https://funimation.com/watch/789',
                leaving: 0
              }
            }
          }
        })
      };
      fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

      const result = await watchmode.getShowDetails(123);
      
      // Crunchyroll should be primary (highest priority)
      expect(result[0].name).toBe('Crunchyroll');
      expect(result[0].isPrimary).toBe(true);
      
      // Funimation should be second
      expect(result[1].name).toBe('Funimation');
      expect(result[1].isPrimary).toBe(false);
      
      // Netflix should be third
      expect(result[2].name).toBe('Netflix');
      expect(result[2].isPrimary).toBe(false);
    });
  });
}); 