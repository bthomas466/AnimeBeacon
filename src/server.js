require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const searchRoutes = require('./routes/search');
const watchlistRoutes = require('./routes/watchlist');
const cors = require('cors');
const cron = require('node-cron');
const { syncEpisodes } = require('./jobs/sync-airdates');
const { sendReminders } = require('./jobs/send-reminders');
const showsRoutes = require('./routes/shows');
const calendarRoutes = require('./routes/calendar');
const { PrismaClient } = require('@prisma/client');

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/search', searchRoutes);
app.use('/watchlist', watchlistRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/calendar', calendarRoutes);

// Schedule the sync-airdates job to run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily episode sync...');
  try {
    await syncEpisodes();
    console.log('Episode sync completed successfully');
  } catch (error) {
    console.error('Error running episode sync:', error);
  }
});

// Schedule the send-reminders job to run daily at 6 PM
cron.schedule('0 18 * * *', async () => {
  console.log('Running daily episode reminders...');
  try {
    await sendReminders();
    console.log('Episode reminders completed successfully');
  } catch (error) {
    console.error('Error sending episode reminders:', error);
  }
});

// Development-only endpoint for simulating reminders
if (process.env.NODE_ENV === 'development') {
  app.post('/dev/simulate-reminder', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Find user and their watchlist
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          watchList: {
            include: {
              show: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get tomorrow's date in user's timezone
      const userTimezone = user.timezone || 'UTC';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find episodes airing tomorrow
      const episodes = await prisma.episode.findMany({
        where: {
          showId: {
            in: user.watchList.map(item => item.showId)
          },
          airDate: {
            gte: tomorrow,
            lt: nextDay
          }
        },
        include: {
          show: true
        }
      });

      if (episodes.length === 0) {
        return res.json({ 
          message: 'No episodes found for tomorrow',
          user: {
            id: user.id,
            email: user.email,
            timezone: userTimezone
          }
        });
      }

      // Group episodes by show
      const episodesByShow = episodes.reduce((acc, episode) => {
        if (!acc[episode.show.title]) {
          acc[episode.show.title] = [];
        }
        acc[episode.show.title].push(episode);
        return acc;
      }, {});

      // Log the reminder content (in production this would send an email)
      console.log('Simulated Reminder Email:');
      console.log('To:', user.email);
      console.log('Timezone:', userTimezone);
      console.log('\nEpisodes for tomorrow:');
      Object.entries(episodesByShow).forEach(([showTitle, showEpisodes]) => {
        console.log(`\n${showTitle}:`);
        showEpisodes.forEach(episode => {
          console.log(`- Episode ${episode.episodeNumber}: ${episode.title}`);
          console.log(`  Air Time: ${new Date(episode.airDate).toLocaleString('en-US', { timeZone: userTimezone })}`);
          console.log(`  Sub/Dub: ${episode.isSubbed ? 'Sub' : ''}${episode.isSubbed && episode.isDubbed ? '/' : ''}${episode.isDubbed ? 'Dub' : ''}`);
        });
      });

      res.json({
        message: 'Reminder simulated successfully',
        user: {
          id: user.id,
          email: user.email,
          timezone: userTimezone
        },
        episodes: episodesByShow
      });

    } catch (error) {
      console.error('Error simulating reminder:', error);
      res.status(500).json({ error: 'Failed to simulate reminder' });
    }
  });
}

app.get('/', (req, res) => {
  res.json({ message: 'Anime Tracker API running' });
});

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app; 