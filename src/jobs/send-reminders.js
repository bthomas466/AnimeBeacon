const { PrismaClient } = require('@prisma/client');
const { sendEpisodeReminder } = require('../services/email');

const prisma = new PrismaClient();

const getTomorrowEpisodes = async (userId, timezone) => {
  // Get user's watchlist shows
  const watchlist = await prisma.watchList.findMany({
    where: {
      userId,
      status: 'watching',
    },
    include: {
      show: true,
    },
  });

  const showIds = watchlist.map(item => item.showId);

  // Get tomorrow's date in user's timezone
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);

  // Get episodes airing tomorrow
  const episodes = await prisma.episode.findMany({
    where: {
      showId: {
        in: showIds,
      },
      airDate: {
        gte: tomorrow,
        lt: nextDay,
      },
    },
    include: {
      show: true,
    },
    orderBy: [
      { airDate: 'asc' },
      { show: { title: 'asc' } },
    ],
  });

  return episodes;
};

const sendReminders = async () => {
  try {
    // Get all users who opted in to notifications
    const users = await prisma.user.findMany({
      where: {
        notificationOptIn: true,
      },
    });

    for (const user of users) {
      try {
        // Get tomorrow's episodes for this user
        const episodes = await getTomorrowEpisodes(user.id, user.timezone);

        if (episodes.length > 0) {
          // Send email reminder
          await sendEpisodeReminder(user, episodes);
          console.log(`Sent reminder email to ${user.email}`);
        }
      } catch (error) {
        console.error(`Error sending reminder to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in sendReminders:', error);
    throw error;
  }
};

module.exports = { sendReminders }; 