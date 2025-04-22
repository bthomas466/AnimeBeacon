const prisma = require('./db');

describe('Database Connection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database', async () => {
    // This will throw an error if the connection fails
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  });
}); 