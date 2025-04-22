const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// AniList GraphQL API endpoint
const ANILIST_API = 'https://graphql.anilist.co';

// GraphQL query for searching anime
const SEARCH_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          large
          medium
        }
        status
        episodes
        genres
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
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
      }
    }
  }
`;

/**
 * Search for anime titles using the AniList GraphQL API
 * @route GET /api/search
 * @param {string} q - Search query
 * @returns {Object} Search results
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    
    // Handle empty query
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query is required',
        results: []
      });
    }
    
    // Make request to AniList API
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search: q }
      })
    });
    
    if (!response.ok) {
      throw new Error(`AniList API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract and format the results
    const results = data.data.Page.media.map(anime => ({
      id: anime.id,
      malId: anime.idMal,
      title: anime.title.userPreferred || anime.title.english || anime.title.romaji,
      coverImage: anime.coverImage.large || anime.coverImage.medium,
      status: anime.status,
      episodes: anime.episodes,
      genres: anime.genres,
      startDate: anime.startDate,
      endDate: anime.endDate,
      nextAiringEpisode: anime.nextAiringEpisode
    }));
    
    res.json({ results });
  } catch (error) {
    console.error('Error searching AniList:', error);
    res.status(500).json({ 
      error: 'Failed to search for anime titles',
      message: error.message
    });
  }
});

module.exports = router; 