const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { prisma } = require('../db');
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const googleCalendar = require('../services/google-calendar');

const prismaClient = new PrismaClient();

// AniList GraphQL API endpoint
const ANILIST_API = 'https://graphql.anilist.co';

// Valid status values
const VALID_STATUSES = ['watching', 'dropped', 'completed'];

// Valid sort fields
const VALID_SORT_FIELDS = ['airDate', 'title'];

// Valid platforms
const VALID_PLATFORMS = ['netflix', 'crunchyroll', 'funimation', 'hidive', 'amazon'];

// GraphQL query for fetching show details
const SHOW_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      episodes
      status
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
    }
  }
`;

/**
 * Get show details from AniList
 * @param {number} id - AniList ID
 * @returns {Promise<Object>} Show details
 */
async function getShowDetails(id) {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: SHOW_QUERY,
      variables: { id }
    })
  });

  if (!response.ok) {
    throw new Error(`AniList API responded with status: ${response.status}`);
  }

  const data = await response.json();
  return data.data.Media;
}

/**
 * Get user's watch list with filters and sorting
 * @route GET /api/watchlist
 * @param {string} status - Filter by status (watching, dropped, completed)
 * @param {string} sort - Sort field (airDate, title)
 * @param {string} platform - Filter by platform
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status, sort, platform } = req.query;
    
    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Validate sort field if provided
    if (sort && !VALID_SORT_FIELDS.includes(sort)) {
      return res.status(400).json({ 
        error: `Invalid sort field. Must be one of: ${VALID_SORT_FIELDS.join(', ')}`
      });
    }

    // Validate platform if provided
    if (platform && !VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({ 
        error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`
      });
    }

    // Build where clause
    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(platform && { show: { platforms: { has: platform } } })
    };

    // Build orderBy clause
    const orderBy = sort ? {
      ...(sort === 'title' && { show: { title: 'asc' } }),
      ...(sort === 'airDate' && { show: { startDate: 'asc' } })
    } : undefined;

    const watchList = await prisma.watchList.findMany({
      where,
      orderBy,
      include: {
        show: {
          select: {
            id: true,
            title: true,
            externalId: true,
            platforms: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    res.json({ watchList });
  } catch (error) {
    console.error('Error fetching watch list:', error);
    res.status(500).json({ error: 'Failed to fetch watch list' });
  }
});

/**
 * Add show to watch list
 * @route POST /api/watchlist
 * @param {number} showId - AniList ID
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { showId } = req.body;

    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    // Check if show exists in our database
    let show = await prisma.show.findFirst({
      where: {
        id: String(showId)
      }
    });

    // If show doesn't exist, fetch from AniList and create it
    if (!show) {
      const showDetails = await getShowDetails(showId);
      
      show = await prisma.show.create({
        data: {
          id: String(showDetails.id),
          title: showDetails.title.userPreferred || showDetails.title.english || showDetails.title.romaji,
          externalId: String(showDetails.idMal || showDetails.id),
          platforms: [],
          startDate: showDetails.startDate ? new Date(
            showDetails.startDate.year, 
            showDetails.startDate.month - 1, 
            showDetails.startDate.day
          ) : null
        }
      });
    }

    // Add to user's watch list
    const watchListEntry = await prisma.watchList.create({
      data: {
        userId: req.user.id,
        showId: show.id,
        status: 'watching'
      },
      include: {
        show: true
      }
    });

    res.status(201).json({ watchListEntry });
  } catch (error) {
    console.error('Error adding to watch list:', error);
    res.status(500).json({ error: 'Failed to add show to watch list' });
  }
});

/**
 * Remove show from watch list
 * @route DELETE /api/watchlist/:showId
 * @param {string} showId - Show ID
 */
router.delete('/:showId', isAuthenticated, async (req, res) => {
  try {
    const { showId } = req.params;

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.watchList.findFirst({
      where: {
        showId,
        userId: req.user.id
      }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Show not found in watch list' });
    }

    // Delete the entry
    await prisma.watchList.delete({
      where: {
        id: existingEntry.id
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing from watch list:', error);
    res.status(500).json({ error: 'Failed to remove show from watch list' });
  }
});

// Update watchlist status
router.put('/:showId', isAuthenticated, async (req, res) => {
  try {
    const { showId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const watchlistItem = await prismaClient.watchList.update({
      where: {
        userId_showId: {
          userId,
          showId,
        },
      },
      data: { status },
      include: {
        show: true,
      },
    });

    // If show is dropped, delete calendar events
    if (status === 'dropped') {
      try {
        const user = await prismaClient.user.findUnique({
          where: { id: userId },
          select: {
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
          },
        });

        if (user?.googleCalendarId) {
          // Set credentials for this user
          googleCalendar.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
          });

          // Get future episodes for this show
          const episodes = await prismaClient.episode.findMany({
            where: {
              showId,
              airDate: { gt: new Date() },
            },
          });

          // Delete calendar events for each episode
          for (const episode of episodes) {
            try {
              const event = googleCalendar.createEpisodeEvent(episode, watchlistItem.show);
              const events = await googleCalendar.listEvents(
                user.googleCalendarId,
                episode.airDate,
                new Date(episode.airDate.getTime() + 24 * 60 * 60 * 1000)
              );

              const matchingEvent = events.find(e => 
                e.summary === event.summary && 
                e.description === event.description
              );

              if (matchingEvent) {
                await googleCalendar.deleteEvent(user.googleCalendarId, matchingEvent.id);
              }
            } catch (error) {
              console.error(`Error deleting calendar event for episode ${episode.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error handling calendar events for dropped show:', error);
      }
    }

    res.json(watchlistItem);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

module.exports = router; 