const { google } = require('googleapis');
const googleCalendar = require('./google-calendar');

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('https://auth-url'),
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expiry_date: Date.now() + 3600000,
          },
        }),
      })),
    },
    calendar: jest.fn().mockReturnValue({
      events: {
        insert: jest.fn().mockResolvedValue({ data: { id: 'test-event-id' } }),
        delete: jest.fn().mockResolvedValue({}),
        list: jest.fn().mockResolvedValue({
          data: {
            items: [
              {
                id: 'test-event-id',
                summary: 'Test Show - Episode 1',
                description: 'Test Episode\n\nSub • Dub\nWatch on: Crunchyroll',
              },
            ],
          },
        }),
      },
    }),
  },
}));

describe('GoogleCalendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate auth URL with correct parameters', () => {
      const authUrl = googleCalendar.getAuthUrl();
      expect(authUrl).toBe('https://auth-url');
      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    });
  });

  describe('getTokens', () => {
    it('should get tokens from Google OAuth', async () => {
      const tokens = await googleCalendar.getTokens('test-code');
      expect(tokens).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expiry_date: expect.any(Number),
      });
    });
  });

  describe('createEvent', () => {
    it('should create a calendar event', async () => {
      const event = {
        summary: 'Test Event',
        description: 'Test Description',
        start: { dateTime: '2024-01-01T00:00:00Z' },
        end: { dateTime: '2024-01-01T01:00:00Z' },
      };

      const result = await googleCalendar.createEvent('test@example.com', event);
      expect(result).toEqual({ id: 'test-event-id' });
    });
  });

  describe('deleteEvent', () => {
    it('should delete a calendar event', async () => {
      await googleCalendar.deleteEvent('test@example.com', 'test-event-id');
      expect(google.calendar().events.delete).toHaveBeenCalledWith({
        calendarId: 'test@example.com',
        eventId: 'test-event-id',
      });
    });
  });

  describe('createEpisodeEvent', () => {
    it('should create an episode event with correct format', () => {
      const episode = {
        episodeNumber: 1,
        title: 'Test Episode',
        airDate: '2024-01-01T00:00:00Z',
        isSubbed: true,
        isDubbed: true,
      };

      const show = {
        title: 'Test Show',
        primaryPlatform: 'Crunchyroll',
      };

      const event = googleCalendar.createEpisodeEvent(episode, show);
      expect(event).toEqual({
        summary: 'Test Show - Episode 1',
        description: 'Test Episode\n\nSub • Dub\nWatch on: Crunchyroll',
        start: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timeZone: 'UTC',
        },
        end: {
          dateTime: '2024-01-01T00:30:00.000Z',
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      });
    });
  });
}); 