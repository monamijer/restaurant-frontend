# Restaurant Frontend

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/Vitest-758%20passing-6e9f18?logo=vitest&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20FR-blue)

Vue 3 single-page application for the restaurant **table, queue and online ordering** system. It talks to the Django REST API of the [`restaurant-backend`](https://github.com/monamijer/restaurant-backend) repository.

The customer journey covers the menu, the cart, the table scan, the queue, reservations, checkout with a simulated payment gateway, invoices and notifications. The staff and administration areas cover the order board, the floor, payments, the menu, users and reports.

## Features

**Customers**
- Menu with search, category and price filters, sorting and pagination. Filters live in the URL, so a filtered view can be shared and works with the back button.
- Cart, checkout, order tracking, reservations, invoices and notifications.

**Staff** (`/staff`)
- Dashboard, order board, walk-in orders and the queue.
- Reservations with search by customer and confirm, reject and complete actions.
- Payments with status and method filters, and confirmation of pending cash payments.
- Menu availability during service, a read-only customer list, tables and QR codes.

**Administration** (`/admin`)
- Dashboard and reports with Chart.js charts.
- CRUD for dishes, categories, tables and users, plus restaurant settings.

## Stack

- Vue 3.5, **Options API only** (`<script setup>`, `setup()` and Composition API imports are rejected by ESLint)
- Vite 8, Vue Router 5, Pinia 4 (options stores), Axios 1.20, vue-i18n 11, Chart.js 4 (via `BaseChart`)
- Vitest 5, @vue/test-utils, jsdom, ESLint 10
- Self-hosted fonts (Fraunces, Inter), design tokens in `src/assets/styles/tokens.css`, no UI framework

## Requirements

Node 22.13 or newer (or 24+) and npm. The backend must be running, with `CORS_ALLOWED_ORIGINS` containing `http://localhost:5173`.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:5173`. The dev server uses `strictPort`: it refuses to start on another port, because the backend only accepts that exact origin.

Edit `.env` if your API does not run on the default URL.

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Base URL of the Django API |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 5173 |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit and component tests (Vitest) |
| `npm run lint` | ESLint |

`npm run lint`, `npm test` and `npm run build` must stay green before any push.

## Demo accounts

The backend ships a `seed_demo` management command. The password is the same for every account: `Demo-Passw0rd!`.

| Email | Role | Lands on |
| --- | --- | --- |
| `admin@demo.example` | admin | `/admin` |
| `server@demo.example`, `kitchen@demo.example` | staff | `/staff` |
| `client1@demo.example` … `client6@demo.example` | client | `/client/account` |

```bash
# in the backend repository, once
python manage.py seed_demo
python manage.py runserver
```

## Project layout

```text
src/
  main.js                 entry point: Pinia, i18n, router, session expiry, cart sync
  App.vue                 picks the layout from route.meta.layout, boots the settings
  config.js               API URL, timeouts, currency, list limits, locales
  config/navigation.js    header links per role
  assets/styles/          tokens.css, base.css
  i18n/                   vue-i18n setup and per-namespace locale files (en, fr)
  layouts/                MainLayout (header, footer), AuthLayout
  router/                 routes.js, guards.js, title.js, expiry.js
  services/               one file per backend area, plus session.js and api.js
  store/                  Pinia stores (auth, cart, ui, toasts, restaurant, menu, table, notifications)
  components/             common, layout, menu, cart, orders, staff, admin, account
  views/                  customer pages, staff/, admin/, account/, auth/, errors/, dev/
  utils/                  pure helpers (money, dates, errors, roles, redirect, menu query)
tests/
  setup.js                jsdom stubs (chart.js is mocked: jsdom has no canvas)
  helpers/                mountAt, fakeServer, fixtures
  unit/, components/, views/, services/
docs/
  HANDOFF.md              how the project was built, for the next reader
  decisions/              architecture decision records
```

## Roles and areas

- **Public**: menu, cart, queue summary, scan landing page.
- **Client**: profile, orders, order tracking, reservations, invoices, notifications, checkout (behind `requiresAuth`).
- **Staff** (`/staff`): dashboard, orders, walk-in order, reservations, queue, tables, payments, menu availability, customers.
- **Admin** (`/admin`): dashboard, categories, menu and image upload, tables, settings, users, reports.

The frontend never decides who may do what: every `meta.roles` entry mirrors a backend permission, and the backend is the authority.

## Rules of the project

- **Options API only.** Stores are options stores, consumed with `mapState` / `mapActions`.
- **No semicolons, single quotes.** Enforced by convention and review.
- **Design tokens.** Every colour, size and motion value comes from `tokens.css`. Components use scoped CSS and the shared classes from `base.css`.
- **Mobile first.** Styles start from the smallest screen and grow with `min-width` queries. Touch targets are at least `var(--target-size)`.
- **Accessibility.** Real buttons and links, labels tied to inputs, visible focus, `aria-live` for status changes, no information by colour alone, reduced motion respected.
- **Money and dates.** Amounts come from the API as decimal strings. The client never computes or sends a price: cart totals are display estimates in integer cents.
- **No `v-html`.** Query values read from the URL are whitelisted, and redirects go through `safeRedirect`.
- **i18n.** English is the default; French is selectable and remembered. Every user-facing string goes through `$t`, with the same keys in both languages. Menu content and notification messages come from the backend and are not translated (known limitation).
- **Tests.** Every change comes with tests.

## Known limitations

- Staff cannot yet create a reservation on behalf of a customer: the backend does not accept a `customer` field on creation.
- Dish images come from Wikimedia, with credits in the backend's `media/menu/ATTRIBUTIONS.txt`.

## Further reading

- `docs/HANDOFF.md`: project state, API contract, patterns, gotchas, roadmap.
- `docs/decisions/`: the architecture decision records (Options API, token storage, Pinia, i18n, CSS tokens).
