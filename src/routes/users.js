const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { userPreferencesSchema } = require('../schemas/user');
const { prisma } = require('../db');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prismaClient = new PrismaClient();

router.post('/preferences', isAuthenticated, async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    // Validate input
    const validatedData = userPreferencesSchema.parse(req.body);
    console.log('Validated data:', validatedData);

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        language: validatedData.language,
        timezone: validatedData.timezone,
        notificationOptIn: validatedData.notificationOptIn,
      },
      select: {
        id: true,
        email: true,
        name: true,
        language: true,
        timezone: true,
        notificationOptIn: true,
      },
    });
    console.log('Updated user:', updatedUser);

    res.json(updatedUser);
  } catch (error) {
    console.error('Error in /preferences:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
module.exports = router; 