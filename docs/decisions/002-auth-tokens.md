# 002 — Authentication and token storage

## Context

The backend issues Simple JWT tokens: a 15-minute access token and a 7-day
refresh token. It rotates the refresh token on every refresh and blacklists the
old one. A stolen refresh token is therefore useful only once, but any XSS can
read `localStorage`, so the access token should live as short a life as
possible.

## Decision

- The **access token** lives in **memory only** (a module-level variable in
  `src/services/session.js`). A page reload loses it.
- The **refresh token** lives in `localStorage` under the key
  `restaurant.refresh`. A page reload uses it to mint a new pair.
- The Axios instance (`src/services/api.js`) attaches the access token on every
  request and, on a single `401`, tries to refresh **once**. Concurrent 401s
  share one refresh promise so the rotating refresh token is not consumed
  twice.
- If the refresh fails, the session is cleared and the router sends the visitor
  to `login` with a `redirect` query. The redirect target is validated by
  `safeRedirect` to avoid open redirects.
- Signing out calls `POST /auth/logout/` (to blacklist the refresh token) and
  clears the local session even if the call fails.

## Consequences

- A stolen access token stops working after 15 minutes.
- A stolen refresh token stops working after one use (rotation).
- A page reload costs one extra request (`/auth/refresh/`) before the app
  becomes interactive.
- Tests stub the session and the Axios adapter rather than touching
  `localStorage` in the components.
