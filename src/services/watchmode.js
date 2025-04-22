const fetch = require('node-fetch');

class WatchmodeService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.watchmode.com/v1';
  }

  async searchShow(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?apiKey=${this.apiKey}&search_field=name&search_value=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search show');
      }

      const data = await response.json();
      return data.title_results[0];
    } catch (error) {
      console.error('Error searching show:', error);
      throw error;
    }
  }

  async getShowDetails(tmdbId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/title/details?apiKey=${this.apiKey}&tmdb_id=${tmdbId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch show details');
      }

      const data = await response.json();
      return this.formatStreamingData(data);
    } catch (error) {
      console.error('Error fetching show details:', error);
      throw error;
    }
  }

  formatStreamingData(data) {
    if (!data || !data.streaming_info) {
      return [];
    }

    const platforms = [];
    const usStreaming = data.streaming_info.us || {};

    // Map of platform names to their logos
    const platformLogos = {
      'netflix': 'https://logo.clearbit.com/netflix.com',
      'crunchyroll': 'https://logo.clearbit.com/crunchyroll.com',
      'funimation': 'https://logo.clearbit.com/funimation.com',
      'hidive': 'https://logo.clearbit.com/hidive.com',
      'amazon': 'https://logo.clearbit.com/amazon.com'
    };

    // Platform priority order (higher index = higher priority)
    const platformPriority = {
      'netflix': 1,
      'crunchyroll': 5,
      'funimation': 4,
      'hidive': 2,
      'amazon': 3
    };

    // Process each platform
    for (const [platform, info] of Object.entries(usStreaming)) {
      if (platformLogos[platform]) {
        platforms.push({
          name: platform.charAt(0).toUpperCase() + platform.slice(1),
          logo: platformLogos[platform],
          url: info.link,
          hasSub: info.type === 'sub',
          hasDub: info.type === 'dub',
          isPrimary: false // Will be set later
        });
      }
    }

    // Sort platforms by priority
    platforms.sort((a, b) => platformPriority[b.name.toLowerCase()] - platformPriority[a.name.toLowerCase()]);

    // Mark the highest priority platform as primary
    if (platforms.length > 0) {
      platforms[0].isPrimary = true;
    }

    return platforms;
  }
}

module.exports = WatchmodeService; 