const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { prisma } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const WatchmodeService = require('../services/watchmode');

// Initialize Watchmode service
const watchmode = new WatchmodeService(process.env.WATCHMODE_API_KEY);

// GraphQL query for AniList API
const SHOW_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
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
      episodes {
        nodes {
          id
          number
          title
          airDate
        }
      }
    }
  }
`;

// Helper function to convert AniList date to ISO string
const formatDate = (date) => {
  if (!date || !date.year) return null;
  return new Date(date.year, date.month - 1, date.day).toISOString();
};

// Helper function to determine airing status
const getAiringStatus = (startDate, endDate) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (!start) return 'upcoming';
  if (end && end < now) return 'finished';
  if (start > now) return 'upcoming';
  return 'airing';
};

// GET /shows/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    if (isNaN(showId)) {
      return res.status(400).json({ error: 'Invalid show ID' });
    }

    // Fetch show data from AniList
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: SHOW_QUERY,
        variables: { id: showId }
      })
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const { data } = await response.json();
    if (!data?.Media) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const show = data.Media;

    // Get local episode tracking data if show exists in database
    const localShow = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        episodes: {
          select: {
            number: true,
            watched: true,
            subWatched: true,
            dubWatched: true
          }
        }
      }
    });

    // Format episodes with local tracking data
    const episodes = show.episodes.nodes.map(episode => {
      const localEpisode = localShow?.episodes.find(e => e.number === episode.number) || {};
      return {
        id: episode.id,
        number: episode.number,
        title: episode.title,
        airDate: formatDate(episode.airDate),
        watched: localEpisode.watched || false,
        subWatched: localEpisode.subWatched || false,
        dubWatched: localEpisode.dubWatched || false
      };
    });

    // Get streaming platforms from Watchmode
    const platforms = await watchmode.getShowDetails(showId);

    // Construct response
    const result = {
      id: show.id,
      title: {
        romaji: show.title.romaji,
        english: show.title.english,
        native: show.title.native
      },
      synopsis: show.description,
      coverImage: show.coverImage.large,
      episodeCount: show.episodes,
      status: getAiringStatus(
        formatDate(show.startDate),
        formatDate(show.endDate)
      ),
      episodes,
      platforms
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching show:', error);
    res.status(500).json({ error: 'Failed to fetch show details' });
  }
});

module.exports = router; 