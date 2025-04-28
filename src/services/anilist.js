const fetch = require('node-fetch');

const ANILIST_API = 'https://graphql.anilist.co';

const RECOMMENDATIONS_QUERY = `
  query ($genres: [String], $page: Int) {
    Page(page: $page, perPage: 50) {
      media(type: ANIME, genre_in: $genres, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
          userPreferred
        }
        genres
        description
        coverImage {
          large
        }
        averageScore
      }
    }
  }
`;

async function fetchRecommendations(genres, page = 1) {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: RECOMMENDATIONS_QUERY,
        variables: { genres, page }
      })
    });

    if (!response.ok) {
      throw new Error(`AniList API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.Page.media;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

module.exports = {
  fetchRecommendations
}; 