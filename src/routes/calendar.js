const express = require('express');
const { PrismaClient } = require('@prisma/client');
const googleCalendar = require('../services/google-calendar');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Google Calendar auth URL
router.get('/auth-url', authenticateToken, (req, res) => {
  const authUrl = googleCalendar.getAuthUrl();
  res.json({ authUrl });
});

// Handle Google Calendar OAuth callback
router.get('/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await googleCalendar.getTokens(code);
    
    // Update user with Google Calendar credentials
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        googleCalendarId: req.user.email,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: new Date(Date.now() + tokens.expiry_date),
      },
    });

    res.json({ message: 'Google Calendar connected successfully' });
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    res.status(500).json({ error: 'Failed to connect Google Calendar' });
  }
});

// Disconnect Google Calendar
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        googleCalendarId: null,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
      },
    });

    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar' });
  }
});

// Get calendar sync status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        googleCalendarId: true,
        googleTokenExpiry: true,
      },
    });

    const isConnected = !!user.googleCalendarId;
    const isTokenValid = user.googleTokenExpiry ? new Date() < user.googleTokenExpiry : false;

    res.json({
      isConnected,
      isTokenValid,
      needsReauth: isConnected && !isTokenValid,
    });
  } catch (error) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({ error: 'Failed to get calendar status' });
  }
});

module.exports = router; 