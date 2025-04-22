const request = require('supertest');
const app = require('./server');

describe('Root Route', () => {
  it('should return 200 and correct message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Anime Tracker API running' });
  });
}); 