const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const googleCalendar = require('../services/google-calendar');

const prisma = new PrismaClient();

const ANILIST_API = 'https://graphql.anilist.co';

const fetchShowEpisodes = async (showId) => {
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        episodes {
          number
          title
          airDate
          isSubbed
          isDubbed
        }
      }
    }
  `;

  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { id: showId },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch episodes for show ${showId}`);
  }

  const data = await response.json();
  return data.data.Media.episodes;
};

const createCalendarEvents = async (episode, show) => {
  try {
    // Get users watching this show who have Google Calendar connected
    const users = await prisma.user.findMany({
      where: {
        watchList: {
          some: {
            showId: show.id,
            status: 'watching',
          },
        },
        googleCalendarId: { not: null },
        googleTokenExpiry: { gt: new Date() },
      },
    });

    for (const user of users) {
      try {
        // Set credentials for this user
        googleCalendar.setCredentials({
          access_token: user.googleAccessToken,
          refresh_token: user.googleRefreshToken,
        });

        // Create calendar event
        const event = googleCalendar.createEpisodeEvent(episode, show);
        await googleCalendar.createEvent(user.googleCalendarId, event);
      } catch (error) {
        console.error(`Error creating calendar event for user ${user.id}:`, error);
        // Continue with other users even if one fails
      }
    }
  } catch (error) {
    console.error('Error in createCalendarEvents:', error);
  }
};

const syncEpisodes = async () => {
  try {
    const shows = await prisma.show.findMany();
    
    for (const show of shows) {
      try {
        const episodes = await fetchShowEpisodes(show.anilistId);
        
        for (const episode of episodes) {
          if (episode.airDate) {
            // Upsert episode
            const upsertedEpisode = await prisma.episode.upsert({
              where: {
                showId_episodeNumber: {
                  showId: show.id,
                  episodeNumber: episode.episodeNumber,
                },
              },
              update: {
                title: episode.title,
                airDate: new Date(episode.airDate),
                isSubbed: episode.isSubbed,
                isDubbed: episode.isDubbed,
              },
              create: {
                showId: show.id,
                episodeNumber: episode.episodeNumber,
                title: episode.title,
                airDate: new Date(episode.airDate),
                isSubbed: episode.isSubbed,
                isDubbed: episode.isDubbed,
              },
            });

            // Create calendar events for new episodes
            if (episode.airDate > new Date()) {
              await createCalendarEvents(upsertedEpisode, show);
            }
          }
        }
        
        console.log(`Synced episodes for show: ${show.title}`);
      } catch (error) {
        console.error(`Error syncing episodes for show ${show.title}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in syncEpisodes:', error);
    throw error;
  }
};

// Export the sync function for testing
module.exports = { syncEpisodes }; 