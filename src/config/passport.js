const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const prisma = require('../db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Helper function to handle user creation/lookup
async function handleAuthUser(profile, provider) {
  try {
    // Check if user already exists with this provider ID
    let user = await prisma.user.findUnique({
      where: { providerId: profile.id },
    });

    if (!user) {
      // Check if user exists with same email but different provider
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // Return existing user without modifying their provider details
        return existingUser;
      }

      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.displayName || profile.username || profile.name,
          provider: provider,
          providerId: profile.id,
        },
      });
    }

    return user;
  } catch (error) {
    throw error;
  }
}

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await handleAuthUser({
          id: profile.id,
          email: profile.emails[0].value,
          displayName: profile.displayName,
        }, 'google');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Discord Strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: '/auth/discord/callback',
      scope: ['identify', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await handleAuthUser({
          id: profile.id,
          email: profile.email,
          username: profile.username,
        }, 'discord');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Apple Strategy
passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
      callbackURL: '/auth/apple/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
      try {
        // Apple doesn't provide email on subsequent logins
        const email = profile.email || req.body.user && JSON.parse(req.body.user).email;
        
        const user = await handleAuthUser({
          id: profile.sub || profile.id,
          email: email,
          name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : undefined,
        }, 'apple');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport; 