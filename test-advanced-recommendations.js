const fetch = require('node-fetch');

async function testAdvancedRecommendations() {
  try {
    console.log('Testing advanced recommendations endpoint...\n');

    // Test 1: Get recommendations with default limit
    console.log('Test 1: Getting recommendations with default limit');
    const response1 = await fetch('http://localhost:3000/recommendations/advanced', {
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    if (!response1.ok) {
      throw new Error(`HTTP error! status: ${response1.status}`);
    }

    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('\nTest 1 passed!\n');

    // Test 2: Get recommendations with custom limit
    console.log('Test 2: Getting recommendations with custom limit');
    const response2 = await fetch('http://localhost:3000/recommendations/advanced?limit=5', {
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    if (!response2.ok) {
      throw new Error(`HTTP error! status: ${response2.status}`);
    }

    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));
    console.log('\nTest 2 passed!\n');

    // Test 3: Verify recommendations are not in user's watchlist
    console.log('Test 3: Verifying recommendations are not in user\'s watchlist');
    const userShows = await fetch('http://localhost:3000/watchlist', {
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    if (!userShows.ok) {
      throw new Error(`HTTP error! status: ${userShows.status}`);
    }

    const userWatchlist = await userShows.json();
    const userShowIds = new Set(userWatchlist.map(entry => entry.show.id));

    const hasDuplicate = data1.recommendations.some(rec => userShowIds.has(rec.id));
    if (hasDuplicate) {
      throw new Error('Found a show in recommendations that is already in user\'s watchlist');
    }

    console.log('Test 3 passed!\n');

    // Test 4: Verify recommendation metadata
    console.log('Test 4: Verifying recommendation metadata');
    if (!data1.metadata || !data1.metadata.basedOn) {
      throw new Error('Missing metadata in response');
    }

    const { basedOn } = data1.metadata;
    if (typeof basedOn.showCount !== 'number' ||
        typeof basedOn.averageRating !== 'number' ||
        typeof basedOn.recencyScore !== 'number' ||
        !Array.isArray(basedOn.topGenres)) {
      throw new Error('Invalid metadata format');
    }

    console.log('Test 4 passed!\n');

    // Test 5: Verify match factors
    console.log('Test 5: Verifying match factors');
    const hasInvalidMatchFactors = data1.recommendations.some(rec => {
      const { matchFactors } = rec;
      return !matchFactors ||
        typeof matchFactors.genreMatch !== 'number' ||
        typeof matchFactors.rating !== 'number' ||
        typeof matchFactors.recency !== 'number' ||
        typeof matchFactors.popularity !== 'number';
    });

    if (hasInvalidMatchFactors) {
      throw new Error('Invalid match factors format');
    }

    console.log('Test 5 passed!\n');

    console.log('All tests passed successfully! 🎉');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

testAdvancedRecommendations(); 