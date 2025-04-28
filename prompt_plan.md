**Anime Tracker App ✨ - Full Prompt Sheet for Code Generation**

---

# Milestone 1: Authentication & Accounts

```text
Prompt 1: Set up Next.js + TypeScript project with TailwindCSS.
Prompt 2: Implement email/password login/signup with secure session management.
Prompt 3: Add Google, Apple, Discord, Twitter, GitHub social login options.
Prompt 4: Restrict access to protected routes; allow public browsing.
```

# Milestone 2: User Profiles & Preferences

```text
Prompt 5: User profile schema: username, email, avatar, social IDs.
Prompt 6: Onboarding: opt-in/out email reminders + calendar sync option.
Prompt 7: Store user preferences: notification and calendar settings.
Prompt 8: Setup authentication-required middlewares.
Prompt 9: Build settings page (edit username, preferences).
Prompt 10: Handle account deletion, data removal, and logout flows.
```

# Milestone 3: Watch List Core

```text
Prompt 11: Integrate AniList API to enable anime search.
Prompt 12: Create WatchList CRUD (add/remove/list).
Prompt 13: Support filtering and sorting of the watch list.
Prompt 14: Add search functionality to the watch list page.
Prompt 15: Display user's watch list in a grid layout.
Prompt 16: Add filter/sort UI controls above the grid.
Prompt 17: Sync watch list on login and app load.
```

# Milestone 4: Show Details & Streaming Info

```text
Prompt 18: Create /shows/:id endpoint for detailed show info.
Prompt 19: Fetch streaming platform info via Watchmode API.
Prompt 20: Build a Show Detail Page with episodes and platforms.
Prompt 21: Highlight the next upcoming episode visually.
Prompt 22: Add logic to pick the "primary" platform per show.
```

# Milestone 5: Calendar + Notifications

```text
Prompt 23: Create daily job to sync episode air dates.
Prompt 24: Create email reminder system (1-day before air date).
Prompt 25: Integrate Google Calendar OAuth + event creation.
Prompt 26: Create notification settings page (email, calendar opt-ins).
Prompt 27: Show upcoming episode reminders on watch list cards.
Prompt 28: Create /dev/simulate-reminder endpoint for testing.
```

# Milestone 6: Ratings + Recommendations (Stretch Goal)

```text
Prompt 29: Add user show rating system (1-5 stars).
Prompt 30: Build genre-based basic recommendation engine.
Prompt 31: Scaffold for future ML-powered recommendations.
Prompt 32: Add interactive rating controls to show cards.
Prompt 33: Build recommendations page with basic/advanced tabs.
Prompt 34: Handle recommendation fallback for new users.
```

---

**Note:**
- Each prompt includes tests (validation and UI updates).
- Early prompts lay foundation; later prompts build safely without introducing large jumps.
- Features are gradually layered in small, testable steps.
- Authentication, notifications, and data syncing are handled securely from early on.

---


