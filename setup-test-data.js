const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function setupTestData() {
  try {
    // Clean up existing data
    await prisma.watchList.deleteMany({});
    await prisma.show.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      }
    });

    // Create test shows with genres
    const shows = await Promise.all([
      prisma.show.create({
        data: {
          id: 'show-1',
          title: 'Action Anime',
          externalId: '101',
          genres: ['Action', 'Adventure', 'Fantasy'],
          synopsis: 'An exciting action anime',
          imageUrl: 'https://example.com/action.jpg',
          avgRating: 4.5
        }
      }),
      prisma.show.create({
        data: {
          id: 'show-2',
          title: 'Romance Anime',
          externalId: '102',
          genres: ['Romance', 'Drama', 'Comedy'],
          synopsis: 'A touching romance story',
          imageUrl: 'https://example.com/romance.jpg',
          avgRating: 4.2
        }
      }),
      prisma.show.create({
        data: {
          id: 'show-3',
          title: 'Mystery Anime',
          externalId: '103',
          genres: ['Mystery', 'Thriller', 'Supernatural'],
          synopsis: 'A thrilling mystery series',
          imageUrl: 'https://example.com/mystery.jpg',
          avgRating: 4.8
        }
      })
    ]);

    // Add shows to user's watchlist with ratings
    const watchlistEntries = await Promise.all([
      prisma.watchList.create({
        data: {
          userId: user.id,
          showId: shows[0].id,
          status: 'completed',
          rating: 5
        }
      }),
      prisma.watchList.create({
        data: {
          userId: user.id,
          showId: shows[1].id,
          status: 'completed',
          rating: 4
        }
      })
    ]);

    console.log('Test data created successfully:', {
      user: { id: user.id, email: user.email },
      shows: shows.map(s => ({ id: s.id, title: s.title, genres: s.genres })),
      watchlistEntries: watchlistEntries.map(w => ({ id: w.id, status: w.status, rating: w.rating }))
    });

  } catch (error) {
    console.error('Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData(); 