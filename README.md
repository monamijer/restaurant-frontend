# Restaurant frontend

Vue 3 single-page application for the restaurant **table, queue and online ordering**
system. It talks to the Django REST API of the `restaurant-backend` repository.

The customer journey covers the menu, the cart, the table scan, the queue, the
reservations, the checkout with a simulated payment gateway, the invoices and the
notifications. The staff and administration areas cover the order board, the floor,
the menu, the users and the reports.

## Stack

- Vue 3.5, **Options API only** (`<script setup>`, `setup()`, `ref`/`reactive`/`computed`
  imports are rejected by ESLint)
- Vite 8, Vue Router 5, Pinia 4 (options stores), Axios 1.20, vue-i18n 11, Chart.js 4 (charts, via BaseChart)
- Vitest 5 + @vue/test-utils + jsdom, ESLint 10
- Self-hosted fonts (Fraunces for headings, Inter for text), design tokens in
  `src/assets/styles/tokens.css`, no UI framework

## Requirements

Node 22.13 or newer (or 24+) and npm. The backend must be running, with
`CORS_ALLOWED_ORIGINS` containing `http://localhost:5173`.

## Setup

```bash
npm install
cp .env.example .env
# edit .env if your API does not run on http://localhost:8000/api
npm run dev
The app runs on http://localhost:5173. The dev server uses strictPort: it
refuses to start on another port, because the backend only accepts that exact
origin.

Environment
.env (see .env.example):

Variable	Default	Meaning
VITE_API_BASE_URL	http://localhost:8000/api	Base URL of the Django API
Scripts
Command	Purpose
npm run dev	Development server on port 5173
npm run build	Production build in dist/
npm run preview	Serve the production build locally
npm test	Unit and component tests (Vitest)
npm run lint	ESLint
The three commands that must stay green before any push are npm run lint,
npm test and npm run build.

Demo accounts
The backend ships a seed_demo management command. The password is the same for
every account: Demo-Passw0rd!.

Email	Role	Where it lands
admin@demo.example	admin	/admin
server@demo.example	staff	/staff
kitchen@demo.example	staff	/staff
client1@demo.example … client6@demo.example	client	/client/account
bash
# in the backend repository, once
python manage.py seed_demo
python manage.py runserver
What lives where
text
src/
  main.js                 entry point: Pinia, i18n, router, session expiry, cart sync
  App.vue                 picks the layout from route.meta.layout, boots the settings
  config.js               API URL, timeouts, currency, list limits, locales
  config/navigation.js    the header links per role
  assets/styles/          tokens.css, base.css
  i18n/                   vue-i18n setup and per-namespace locale files
  layouts/                MainLayout (header, footer), AuthLayout
  router/                 routes.js, guards.js, title.js, expiry.js
  services/               one file per backend area, plus session.js and api.js
  store/                  Pinia stores (auth, cart, ui, toasts, restaurant, menu,
                          table, notifications)
  components/             common, layout, menu, cart, orders, staff, admin, account
  views/                  customer pages, staff/, admin/, account/, auth/, errors/, dev/
  utils/                  pure helpers (money, dates, errors, roles, redirect, ...)
tests/
  setup.js                jsdom stubs
  helpers/                mountAt, fakeServer, fixtures
  unit/, components/, views/, services/
docs/
  HANDOFF.md              how the project was built, for the next reader
  decisions/              architecture decision records
Roles and areas
Public: menu, cart, queue summary, scan landing page.

Client: profile, orders, order tracking, reservations, invoices,
notifications, checkout. The routes are behind requiresAuth.

Staff (/staff): dashboard, order board, walk-in order, order detail,
reservations, queue, tables and their QR codes.

Admin (/admin): dashboard, categories, menu and its image upload,
settings, users, reports.

The frontend never decides who may do what: every meta.roles entry mirrors a
backend permission, and the backend is the authority.

Rules of the project
Options API only. ESLint rejects <script setup>, setup() and the
Composition API imports. Stores are options stores, consumed with
mapState / mapActions.

Design tokens. Every colour, size and motion value comes from
src/assets/styles/tokens.css. Components use scoped CSS and the shared
classes from base.css.

Mobile first. Styles start from the smallest screen and grow with
min-width queries. Touch targets are at least var(--target-size).

Accessibility. Real buttons and links, labels tied to inputs, visible
focus, aria-live for status changes, no information by colour alone,
reduced motion respected.

Money and dates. Amounts come from the API as decimal strings. The
client never computes a price and never sends one: cart totals are display
estimates computed in integer cents.

No v-html. Query values read from the URL are whitelisted, and
redirects go through safeRedirect.

i18n. English is the default UI language for everyone; French is
selectable and remembered. Every user-facing string goes through $t in
both languages. Menu content and notification messages come from the backend
and are not translated (known limitation).

Tests. Every change comes with tests. Run npm run lint, npm test and
npm run build before committing.

Further reading
docs/HANDOFF.md — the state of the project, the API contract the frontend
uses, the patterns, the gotchas, the roadmap.

docs/decisions/ — the five architecture decision records (Options API,
token storage, Pinia, i18n, CSS tokens).
