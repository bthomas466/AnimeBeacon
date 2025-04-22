const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEpisodeReminder = async (user, episodes) => {
  const { email, name, timezone } = user;

  // Group episodes by show
  const episodesByShow = episodes.reduce((acc, episode) => {
    if (!acc[episode.show.title]) {
      acc[episode.show.title] = [];
    }
    acc[episode.show.title].push(episode);
    return acc;
  }, {});

  // Create email content
  const episodesList = Object.entries(episodesByShow)
    .map(([showTitle, showEpisodes]) => {
      const episodesList = showEpisodes
        .map(ep => {
          const airTime = new Date(ep.airDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: timezone 
          });
          
          const labels = [];
          if (ep.isSubbed) labels.push('Sub');
          if (ep.isDubbed) labels.push('Dub');
          
          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>Episode ${ep.episodeNumber}</strong><br>
                ${ep.title}<br>
                <span style="color: #666;">
                  ${labels.join(' • ')} • Airs at ${airTime}
                </span>
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 10px;">${showTitle}</h2>
          <table style="width: 100%;">
            ${episodesList}
          </table>
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Tomorrow's Anime Episodes</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Tomorrow's Anime Episodes</h1>
        <p>Hi ${name},</p>
        <p>Here are the episodes airing tomorrow from your watchlist:</p>
        ${episodesList}
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          You're receiving this email because you opted in to episode reminders. 
          You can manage your notification preferences in your account settings.
        </p>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'Anime Tracker <notifications@animetracker.com>',
      to: email,
      subject: 'Tomorrow\'s Anime Episodes',
      html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

module.exports = {
  sendEpisodeReminder,
}; 