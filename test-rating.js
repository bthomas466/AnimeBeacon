const fetch = require('node-fetch');

async function testRatingEndpoint() {
  const baseUrl = 'http://localhost:3000';
  const showId = 'show-1';
  const token = 'valid-token';

  try {
    // Test valid rating
    console.log('\nTesting valid rating (5 stars)...');
    const validResponse = await fetch(`${baseUrl}/watchlist/${showId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rating: 5 })
    });
    console.log('Status:', validResponse.status);
    console.log('Response:', await validResponse.json());

    // Test invalid rating
    console.log('\nTesting invalid rating (6 stars)...');
    const invalidResponse = await fetch(`${baseUrl}/watchlist/${showId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rating: 6 })
    });
    console.log('Status:', invalidResponse.status);
    console.log('Response:', await invalidResponse.json());

    // Test unauthorized
    console.log('\nTesting unauthorized access...');
    const unauthorizedResponse = await fetch(`${baseUrl}/watchlist/${showId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rating: 5 })
    });
    console.log('Status:', unauthorizedResponse.status);
    console.log('Response:', await unauthorizedResponse.json());

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRatingEndpoint(); 