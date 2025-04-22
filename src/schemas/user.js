const { z } = require('zod');

console.log('Loading user schema...');

const userPreferencesSchema = z.object({
  language: z.string().min(2).max(5),
  timezone: z.string().min(1).max(50),
  notificationOptIn: z.boolean(),
});

console.log('User schema loaded successfully');

module.exports = {
  userPreferencesSchema,
}; 