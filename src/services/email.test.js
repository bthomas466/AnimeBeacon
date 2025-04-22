const { Resend } = require('resend');
const { sendEpisodeReminder } = require('./email');

// Mock Resend
jest.mock('resend');

describe('Email Service', () => {
  let mockResend;

  beforeEach(() => {
    mockResend = {
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
      },
    };
    Resend.mockImplementation(() => mockResend);
  });

  it('should send episode reminder email with correct format', async () => {
    const user = {
      email: 'test@example.com',
      name: 'Test User',
      timezone: 'America/New_York',
    };

    const episodes = [
      {
        episodeNumber: 1,
        title: 'Episode 1',
        airDate: '2024-01-01T20:00:00Z',
        isSubbed: true,
        isDubbed: false,
        show: {
          title: 'Test Show',
        },
      },
      {
        episodeNumber: 2,
        title: 'Episode 2',
        airDate: '2024-01-01T21:00:00Z',
        isSubbed: true,
        isDubbed: true,
        show: {
          title: 'Test Show',
        },
      },
    ];

    await sendEpisodeReminder(user, episodes);

    // Verify email was sent
    expect(mockResend.emails.send).toHaveBeenCalledTimes(1);

    // Get the email data
    const emailData = mockResend.emails.send.mock.calls[0][0];

    // Verify email properties
    expect(emailData.from).toBe('Anime Tracker <notifications@animetracker.com>');
    expect(emailData.to).toBe('test@example.com');
    expect(emailData.subject).toBe('Tomorrow\'s Anime Episodes');

    // Verify HTML content
    const html = emailData.html;
    expect(html).toContain('Test User');
    expect(html).toContain('Test Show');
    expect(html).toContain('Episode 1');
    expect(html).toContain('Episode 2');
    expect(html).toContain('Sub');
    expect(html).toContain('Dub');
  });

  it('should handle errors when sending email', async () => {
    const user = {
      email: 'test@example.com',
      name: 'Test User',
      timezone: 'America/New_York',
    };

    const episodes = [
      {
        episodeNumber: 1,
        title: 'Episode 1',
        airDate: '2024-01-01T20:00:00Z',
        isSubbed: true,
        isDubbed: false,
        show: {
          title: 'Test Show',
        },
      },
    ];

    // Mock email send to fail
    mockResend.emails.send.mockRejectedValue(new Error('Failed to send email'));

    // Verify error is thrown
    await expect(sendEpisodeReminder(user, episodes)).rejects.toThrow('Failed to send email');
  });
}); 