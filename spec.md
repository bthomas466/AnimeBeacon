Anime Watch List Web Application: Development Blueprint

Phase 1: Project Setup & Core Infrastructure

Step 1: Initialize Project

Set up project repository (monorepo or split for frontend/backend).

Choose tech stack: React (frontend), Node.js + Express (backend), PostgreSQL (database).

Set up basic CI/CD pipeline.

Linting, formatting (Prettier + ESLint), commit hooks.

Step 2: Backend Project Setup

Scaffold Node.js project with Express.

Add environment variable handling (dotenv).

Set up basic route and response handler.

Add testing setup (Jest + Supertest).

Step 3: Frontend Project Setup

Scaffold React app with Vite or Create React App.

Add routing support (React Router).

Add basic page layout.

Add component testing setup (Jest + React Testing Library).

Step 4: Database Schema and ORM

Set up PostgreSQL and Prisma ORM.

Define initial schema:

Users

Shows

Episodes

WatchList

Generate migration and seed basic data.

Write and test DB access functions.

Phase 2: Authentication & User Management

Step 5: OAuth Authentication Backend

Set up Google, Apple, Discord OAuth using Passport.js or Auth.js.

Save authenticated users in DB.

Generate JWT or session.

Step 6: OAuth Integration Frontend

Add login buttons (Google, Apple, Discord).

Redirect/callback flow for each provider.

Show logged-in user state.

Step 7: User Preferences

Add onboarding flow for language, timezone, notification opt-in.

Store in database.

Create frontend form.

Phase 3: Watch List & Show Data

Step 8: Fetch Anime Metadata

Integrate AniList API for search and show details.

Show basic data: title, cover image, airing status.

Step 9: Watch List CRUD Backend

Create endpoints:

Add to watch list

Remove from watch list

Update watch status

Fetch user list

Write integration tests.

Step 10: Watch List UI

Display grid layout with quick actions (drop, change status).

Connect API to backend.

Add filter/sort by status, air date, streaming service.

Phase 4: Show Details & Streaming Info

Step 11: Show Detail View

Display episode list, air dates, streaming platforms.

Integrate JustWatch API (or similar).

Step 12: Episode Data Handling

Store episode data in DB.

Sync with AniList for future updates.

Add fallback handling when data is missing.

Phase 5: Notifications & Calendar

Step 13: Email Reminder System

Set up email service (e.g., SendGrid).

Create cron job or scheduler for sending email 1 day before air date.

Respect user preferences.

Step 14: Google Calendar Integration

Let users opt-in during onboarding.

Use Google Calendar API to create events.

Include episode details.

Remove events if user drops show.

Phase 6: Ratings & Recommendations (Stretch Goal)

Step 15: Ratings

Allow user to rate completed shows.

Store in DB.

Update UI.

Step 16: Simple Recommendation Model

Recommend based on genres, ratings, completed shows.

Show suggested list on dashboard.

Step 17: Complex Model (Future)

Analyze watch patterns and seasonal trends.

Use collaborative filtering or embeddings.

Iterate with user feedback.

Iterative Development Breakdown

Chunked Milestones (each 1–2 weeks):

Milestone 1: Infrastructure Setup

Backend scaffold + DB schema + testing setup

Frontend scaffold + routing + base layout

Milestone 2: Authentication

OAuth backend + frontend integration

User creation + session/JWT

Onboarding flow (language, timezone, notifications)

Milestone 3: Watch List Core

Search for anime + add to watch list

Display grid layout + quick actions

Backend API for watch list

Milestone 4: Show & Episodes

Show detail view

Fetch & store episodes

Streaming service integration

Milestone 5: Notifications

Email reminder system

Google Calendar sync

Milestone 6: Stretch

Ratings UI and backend

Simple recommender

Future: complex model

Final Step: Generate Code Prompts

We now have a clean project plan. Next, we will break these down into prompts for a code-generation LLM. Each prompt will be self-contained, test-driven, and build on prior steps. Stay tuned for the next section!

