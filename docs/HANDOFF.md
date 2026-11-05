# Restaurant project: handoff for the next AI assistant

Read this whole file before writing any code. It describes a project that is already built up to a
precise point. Your job is to CONTINUE it without renaming, duplicating or contradicting anything
that exists. When something here conflicts with your habits, this file wins.

---

## 0. How to start

1. Ask the user to paste, if you need them: `docs/api.md` of the BACKEND repo (exact endpoints for
   the staff and admin features, which are not summarised below), and the output of `git log --oneline -15`.
2. Never guess an endpoint, a field name or a status value. If it is not in section 6, read the
   backend `docs/api.md` (ask the user to paste the relevant part).
3. Work in small verified steps (section 3). Start with Phase 8.1 (section 11).

---

## 1. Project and people

- **Project**: "Restaurant Table, Queue & Online Ordering Management System", a Vue.js exam project, due very soon. Time and the user's AI token budget are tight: be efficient,
  deliver complete files, do not ask unnecessary questions.
- **User**: Jerome, computer science student in Burundi. He writes mostly in **French**: answer in
  French. All code, identifiers, code comments, file names and commit messages are in **English**.
- **Repos** (separate):
  - Backend: `~/Documents/jerome/backend/restaurant-backend` (git@github.com:monamijer/restaurant-backend.git)
  - Frontend: `~/Documents/jerome/frontend/restaurant-frontend` (git@github.com:monamijer/restaurant-frontend.git)
- The stack is fixed by the academic spec and is non-negotiable (section 2).

---

## 2. Stack

**Backend (COMPLETE, 429 pytest tests passing)**: Python 3.14, Django 6.1.1, Django REST Framework,
MariaDB 13.0.2 (socket, `DB_HOST=localhost`), Simple JWT (access 15 min, refresh 7 days, rotation +
blacklist), django-filter, django-cors-headers, ReportLab (PDF), pytest, django-environ.
Runs at `http://localhost:8000`, API under `/api/`.

**Frontend**:
- Vue 3.5 with the **Options API ONLY**. Never use `<script setup>`, the Composition API,
  `ref`/`reactive`/`computed` imports from `vue`, `defineProps`, etc. ESLint fails the build on it.
  (`nextTick` from `vue` is allowed.)
- Vite 8, Vue Router 5, Pinia 4 (options-style stores, used in components with `mapState` and
  `mapActions`), Axios 1.20, vue-i18n 11 (composition mode `legacy: false` with
  `globalInjection: true`, so `$t` works in templates and on `this`), Vitest 5 + @vue/test-utils
  + jsdom 29, ESLint 10 (`flat/essential` + custom rules).
- **No Tailwind, no UI library.** Custom CSS design tokens (`src/assets/styles/tokens.css`),
  scoped component styles, light and dark theme (`data-theme` on `<html>`), self-hosted fonts
  (Fraunces for headings, Inter for text).
- Node `^22.13 || >=24`. Dev server `http://localhost:5173` (strictPort).

---

## 3. Working agreements (non-negotiable)

1. **Step by step, files ready to copy-paste into a terminal** (`cat > path <<'EOF' ... EOF`).
   NO zip archives. One step = its own files + its own commits.
2. **After EVERY code block, give a `git add` + `git commit` block.** Commit message: a short
   title and a body, both in single quotes, English, and **no apostrophes inside the message**.
3. To change an existing file, use a small `python3` script with an assert-checked helper so it
   fails loudly if the text is not found:
   ```python
   def edit(path, pairs):
       text = open(path).read()
       for old, new in pairs:
           assert old in text, f"{path}: not found: {old[:70]}"
           text = text.replace(old, new, 1)
       open(path, 'w').write(text)
   ```
   For short files, rewrite the whole file with a heredoc instead.
4. **Tests for everything**, run with `npm run lint`, `npm test`, `npm run build`. The user pastes
   the results back. **No manual curl / API call verification steps**: verify with Vitest, or with
   the UI plus `python manage.py shell -c "..."` against the demo data.
5. Accessibility and mobile first: real buttons and links, labels linked to inputs, 44px touch
   targets (`--target-size`), visible focus, `aria-live`/`role="status"`/`role="alert"` where state
   changes, no information by colour alone, reduced motion respected.
6. **English is the default UI language** for everybody. French is selectable (EN/FR switcher) and
   remembered. The browser language is deliberately NOT consulted. Every user-facing string goes
   through i18n in BOTH languages. Menu content and notification messages come from the backend and
   are NOT translated (known decision, listed in the backend `docs/maintenance-backlog.md`).
7. Money: amounts are **decimal strings** from the API (`"12.50"`). Never use floating point for
   sums. The client NEVER sends a price or an amount: the server computes everything. Cart totals
   are display estimates only (computed in integer cents, `src/utils/money.js`).
8. Security habits already in place: no `v-html`; open-redirect protection (`safeRedirect`);
   whitelisting of URL query values; tokens: access token in memory only, refresh token in
   `localStorage`; the frontend is never the authority on permissions (the backend is).
9. Style of answers: concise, honest about own mistakes, no fluff, no unnecessary questions.

---

## 4. Environment and commands

Frontend `.env` (copy of `.env.example`): `VITE_API_BASE_URL=http://localhost:8000/api`.
Backend `.env` must contain `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
(restart `runserver` after editing `.env`; the browser treats `localhost` and `127.0.0.1` as
different origins; a CORS block looks like "Cannot connect" in the UI and the dev console prints a
hint naming the origin to allow).

```bash
# backend
python manage.py seed_demo          # demo data (once); --reset --force to redo
python manage.py runserver
pytest

# frontend
npm run dev        # http://localhost:5173
npm run lint
npm test
npm run build
```

**Demo accounts** (password for all: `Demo-Passw0rd!`): `admin@demo.example` (admin),
`server@demo.example` and `kitchen@demo.example` (staff), `client1@demo.example` .. `client6@demo.example` (clients).

Useful shell commands against demo data:
```bash
# scan links of tables (QR landing page)
python manage.py shell -c "from apps.tables.models import Table; from apps.tables.qr import scan_url; [print(t.number, scan_url(t)) for t in Table.objects.all()[:3]]"
# move an order forward (pending > confirmed > preparing > ready > completed; completed needs full payment)
python manage.py shell -c "from apps.orders.services import update_status; update_status(ORDER_ID, 'confirmed')"
# call a queue ticket / confirm a reservation (until the staff UI exists)
python manage.py shell -c "from apps.queue_mgmt.models import QueueTicket as T; t=T.objects.filter(status='waiting').last(); t.status='called'; t.save()"
python manage.py shell -c "from apps.reservations.models import Reservation as R; r=R.objects.last(); r.status='confirmed'; r.save()"
```
Dev secrets (DB root password, demo passwords) were shared in chat during development: **rotate
everything at deployment** (new `SECRET_KEY`, DB user and password, admin password). Print table QR
codes only after the final `SECRET_KEY` is set (QR tokens are signed with it).

---

## 5. Status

| Area | State |
|---|---|
| Backend | Complete, 429 tests. API documented in backend `docs/api.md`. |
| Frontend 6.1-6.4 | Tooling, tokens, i18n, components, services, router, guards, auth pages. Done. |
| Frontend 7.1 | Menu: search, filters, sort, pagination, dish page. Done. |
| Frontend 7.2 | Cart (persistent, cross-tab). Done. |
| Frontend 7.3 | Scan table QR, checkout, payment, live order tracking, order list. Done. |
| Frontend 7.4 | Reservations, queue, invoices (PDF), notifications. Done. |
| Frontend 8.1 | Staff: dashboard, order board, order detail, cash payment confirmation, invoice download, walk-in order. Done. |
| Frontend 8.2 | Staff floor: reservations with their actions, queue management, tables with QR download and regenerate. Done. |
| Frontend 8.3 | Admin: home, categories, menu with image upload, settings, users, dashboard, reports with CSV. Done. |
| Frontend 8.4 | Profile and change-password pages for every role. Done. |
| Phase 9 | Integration pass: every staff and admin route tested for each role and for an anonymous visitor. Done. |
| Phase 10 | README, five ADRs, HANDOFF updated, manual demo checklist. Done. |
| Last verified totals | 76 test files / 719 tests + 1 skipped (76th file is `integration-nav.test.js`, 5 tests). Lint clean, build OK. |
| NOT DONE | Deployment: nothing was ever deployed. See the manual checklist and the deployment notes below. |

---

## 6. Backend API contract (everything the frontend uses so far)

Base URL `/api`. JSON. Pagination: `{count, next, previous, results}`, default page size 20, max
`page_size` 100. Auth header `Authorization: Bearer <access>`.

**Error envelope** (every error): `{ "success": false, "message": "...", "errors": {...}, "code": "..." }`.
Codes seen: `VALIDATION_ERROR` (400, `errors` maps field -> list of messages, `non_field_errors`
possible, order item errors are a LIST aligned with the sent items), `AUTHENTICATION_FAILED` (401),
`PERMISSION_DENIED` (403), `NOT_FOUND` (404), `CONFLICT` (409), `THROTTLED` (429, `Retry-After`).
The frontend adds synthetic codes: `NETWORK_ERROR`, `TIMEOUT`, `SERVER_ERROR`, `UNKNOWN_ERROR`.

**Auth** (`authService`)
- `POST /auth/register/` (`email, password, first_name, last_name, phone?`) -> user
- `POST /auth/login/` (`email, password`) -> `{access, refresh, user}`
- `POST /auth/refresh/` (`refresh`) -> `{access, refresh}` (rotation: the old refresh is blacklisted)
- `POST /auth/logout/` (`refresh`)
- `GET|PATCH /auth/me/` -> user `{id, email, first_name, last_name, phone, role, created_at}`; `role` is `client|staff|admin`
- `POST /auth/change-password/` (`old_password, new_password`) -> new `{access, refresh}`
- `POST /auth/password-reset/` (`email`) (same answer whether or not the account exists)
- `POST /auth/password-reset/confirm/` (`uid, token, new_password`); email link: `FRONTEND_URL/reset-password?uid=..&token=..`

**Settings** `GET /settings/` (public): `name, timezone, opening_time, closing_time, tax_rate (e.g. "10.00"), min_reservation_minutes, max_reservation_minutes, slot_step_minutes, ...`

**Menu** (public)
- `GET /categories/` -> plain array of `{id, name, slug, ...}` (not paginated)
- `GET /menu-items/` filters: `category_slug, is_available, is_featured, min_price, max_price, search, ordering (name|price|-price|created_at|preparation_time), page, page_size`
- `GET /menu-items/{id}/`. Item: `id, category, category_name, name, slug, description, price, image (absolute URL|null), is_available, preparation_time, is_featured, allergens (list of strings), calories (int|null)`

**Tables / QR**: `POST /tables/resolve-qr/` (`token`) public -> `{id, number, capacity, location}`. Staff: `qr-code/`, `qr-sheet/`, `regenerate-qr/`. QR link: `FRONTEND_URL/scan?t=<token>`.

**Orders**
- `POST /orders/` -> order. Body: `order_type` (`dine_in|takeaway|delivery`), `items: [{menu_item, quantity (1-50), special_instructions}]`, `notes?`, `delivery_address` (delivery), `contact_phone` (delivery required, else optional), and for dine-in: `table_token` (customers) or `table` (id, staff only).
- `GET /orders/` (own orders for customers, paginated), `GET /orders/{id}/`, `POST /orders/{id}/cancel/` (customer: pending and unpaid only; a paid order cannot be cancelled, no refunds)
- Order: `id, customer, customer_name, order_type, status (pending|confirmed|preparing|ready|completed|cancelled), table, table_number, delivery_address, contact_phone, notes, items [{id, menu_item, item_name, quantity, unit_price, subtotal, special_instructions}], subtotal, tax_rate, tax_amount, total, currency, created_at, updated_at`
- Status machine is enforced by the server; an order can be completed only when fully paid. Staff actions for orders exist: READ backend `docs/api.md` for their exact paths.

**Payments**
- `GET /payments/?order=<id>&ordering=-created_at` -> paginated list
- `POST /payments/` (`order, method (cash|card|mobile_money), payment_token?`). NO amount (server charges the order total). Card and mobile money need a provider token. The simulated gateway declines ONLY the token `tok_declined`, approves any other. A declined payment is returned as a normal 201 with `status: "failed"` (not an error). Cash stays `pending` until staff confirms.
- `POST /payments/{id}/cancel/`
- Payment: `id, order, method, amount, status (pending|paid|failed|refunded), reference ("PAY-XXXXXXXX"), paid_at, created_at, currency`. A pending or paid payment blocks a new one for the same order.

**Invoices**: `GET /invoices/` (paginated, `?order=`), `GET /invoices/{id}/download-pdf/` (authenticated, returns the PDF; the file is private). Invoice: `id, order, invoice_number ("INV-YYYY-NNNNNN", gapless), total, currency, issued_at`. Issued automatically when an order is fully paid.

**Reservations**
- `GET /reservations/availability/?date=YYYY-MM-DD&party_size=N&duration_minutes=M` -> `{date, party_size, duration_minutes, slots: [{starts_at, time: "HH:MM", tables: [{id, number, capacity, location}]}]}`
- `POST /reservations/` (`table, date, time, duration_minutes, party_size, notes?`); `GET /reservations/` (own; `ordering`, `page`, `page_size`); `POST /reservations/{id}/cancel/`
- Reservation: `id, customer, table, table_number, date, time, starts_at, ends_at, duration_minutes, party_size, status (pending|confirmed|rejected|cancelled|completed|no_show), notes, expires_at`. `pending` holds the slot until `expires_at`; a conflict is a 409.

**Queue**
- `GET /queue/summary/` public -> `{waiting, estimated_wait_minutes}`
- `GET /queue/` (own tickets; the app asks `ordering=-pk&page_size=5`), `POST /queue/` (`party_size 1-20`, `phone?`), `POST /queue/{id}/cancel/`
- Ticket: `id, party_size, phone, status (waiting|called|seated|cancelled|no_show), position, estimated_wait_minutes, quoted_wait_minutes, created_at`. Joining twice is a 409.
- Staff actions (call next, seat, no-show): READ backend `docs/api.md`.

**Notifications**: `GET /notifications/` (paginated; `ordering=-created_at`), `GET /notifications/unread-count/` -> `{unread}`, `POST /notifications/{id}/mark-read/`, `POST /notifications/mark-all-read/` -> `{updated}`. Notification: `id, type, message, is_read, created_at`.

**Backend features NOT yet used by the frontend** (this is Phase 8): staff order board and status
changes, cash payment confirmation, staff reservation confirmation/rejection, queue management,
table management and QR codes, menu and category management (admin CRUD, image upload), user
management `/users/`, `/dashboard/stats/`, `/reports/*` with CSV export, change-password screen,
profile editing (`PATCH /auth/me/`).

---

## 7. Frontend architecture (what exists: DO NOT RENAME)

### 7.1 Folders

src/
main.js entry: pinia, i18n, router, session expiry handler, cart cross-tab sync
App.vue picks the layout from route.meta.layout, loads restaurant settings,
starts/stops notification polling with the sign-in state
config.js API_BASE_URL, API_TIMEOUT_MS, CURRENCY (‘USD’), MAX_LINE_QUANTITY (50),
MAX_CART_LINES (50), MAX_NOTE_LENGTH (255), DEFAULT_LOCALE, SUPPORTED_LOCALES
config/navigation.js NAV_ITEMS and navItemsFor(role)
assets/styles/ tokens.css, base.css (global classes: container, stack, cluster, muted,
eyebrow, visually-hidden, page transition)
i18n/ index.js + locales/{en,fr}/<namespace>.json + index.js merging them
layouts/ MainLayout (header, TableBanner, main#main, footer), AuthLayout (centred card)
router/ index.js (createAppRouter(history)), routes.js, guards.js, title.js, expiry.js
services/ session.js, api.js and one *Service.js per backend area
store/ Pinia stores
mixins/ formErrors.js, cartMoney.js
utils/ small pure helpers
components/{common,layout,menu,cart,orders}/
views/ (+ auth/, errors/, dev/)
tests/ setup.js, helpers/, unit/, components/
docs/ HANDOFF.md (this file)


### 7.2 Routes (names are used in code and tests: never rename)
`meta`: `layout` ('main'|'auth'), `titleKey` (i18n key), `requiresAuth`, `roles`, `guestOnly`.
Guards run `auth.restoreSession()` first, then: guestOnly + signed in -> own area; requiresAuth +
anonymous -> `login` with `?redirect=<fullPath>`; role not allowed -> `forbidden`.

| name | path | layout | access |
|---|---|---|---|
| home | `/` | main | public |
| menu | `/menu` (query `q, category, available=1, ordering, page`) | main | public |
| menu-item | `/menu/:id(\d+)` | main | public |
| cart | `/cart` | main | public |
| checkout | `/checkout` | main | signed in |
| scan | `/scan?t=TOKEN` | main | public |
| queue | `/queue` | main | public (join needs sign in) |
| reservations | `/reservations` | main | signed in |
| reservation-new | `/reservations/new` | main | signed in |
| orders | `/orders` | main | signed in |
| order | `/orders/:id(\d+)` | main | signed in |
| invoices | `/invoices` | main | signed in |
| notifications | `/notifications` | main | signed in |
| client-account | `/client/account` | main | signed in |
| login, register | `/login`, `/register` | auth | guestOnly |
| forgot-password, reset-password | `/forgot-password`, `/reset-password?uid&token` | auth | public |
| staff-home | `/staff` | main | staff, admin (PLACEHOLDER) |
| admin-home | `/admin` | main | admin (PLACEHOLDER) |
| forbidden | `/forbidden` | main | public |
| styleguide | `/styleguide` | main | development only |
| not-found | catch-all | main | public |

`homeRouteFor(role)` (utils/roles.js): client -> `client-account`, staff -> `staff-home`, admin -> `admin-home`.
Navigation items (config/navigation.js, in order): home, menu, queue (public); reservations, orders,
account (any signed-in role); staff (staff, admin); admin (admin). The header shows the full
navigation from 72em (4.5rem breakpoint `@media (min-width: 72em)`), a mobile menu below.

### 7.3 Pinia stores (id -> file)
- `auth` (`store/auth.js`): state `user, restored`; getters `isAuthenticated, role, isStaff, isAdmin, fullName`; actions `restoreSession` (single-flight), `login`, `register` (then logs in), `logout`, `expireSession`, `refreshUser`.
- `ui`: `theme`, `locale`; `setTheme, toggleTheme, setLocale, init`; getter `isDark`.
- `toasts`: `items`; `push, success, info, error, dismiss` (auto-dismiss 4.5s, errors 7s, max 4).
- `restaurant`: `settings, loading, failed`; getters `name, taxRate, opensAt, closesAt, hasHours`; `load`.
- `menu`: `categories, loaded, failed`; `loadCategories`.
- `cart`: `lines`; getters `count, isEmpty, quantityOf(id), lineTotal(line), subtotalCents, subtotal, orderItems`; actions `add(item, qty)` -> 'added'|'unavailable'|'limit', `setQuantity, setNote, remove, clear, reload, persist`.
- `table`: `table {token,id,number}`; getters `isSeated, number, token`; `scan(token), clear`.
- `notifications`: `unread, items, count, loading, failed`; `refreshUnread, startPolling, stopPolling, reset, load, markRead, markAllRead`.

Browser storage keys (never change): localStorage `restaurant.theme`, `restaurant.locale`,
`restaurant.refresh` (refresh token), `restaurant.cart`; sessionStorage `restaurant.table`.

### 7.4 Services (components NEVER import axios; they call a service)
`session.js` (access token in memory, refresh token in localStorage); `api.js` (the ONE Axios
instance: adds the Bearer token, per-request flags `skipAuth` and `skipRefresh`, single-flight
refresh on 401 with one replay, `configureApi({ onSessionExpired })`, normalises every failure
into `ApiError`, prints a dev-only hint when no answer is received); `authService`,
`settingsService`, `menuService`, `orderService`, `paymentService`, `tableService`,
`reservationService`, `queueService`, `invoiceService` (`downloadPdf` uses `responseType: 'blob'`),
`notificationService`. Public endpoints pass `{ skipAuth: true, skipRefresh: true }`.

### 7.5 Utils and mixins
`utils/errors.js` (`ApiError {status, code, errors, retryAfter, isNetworkError, isValidation}`,
`toApiError, fieldErrors, describeError(error, t)`), `format.js` (`formatMoney, formatDateTime,
formatDay, todayIn, formatClock`), `money.js` (`toCents, centsToAmount, estimateTaxCents`),
`validation.js` (`isEmail, isBlank`), `redirect.js` (`safeRedirect`), `roles.js` (`ROLES,
STAFF_ROLES, homeRouteFor`), `menuQuery.js`, `tableCode.js`, `orders.js` (`ORDER_STEPS,
orderStatusTone, isFinished`), `reservations.js` (tones, `durationOptions, smallestTable,
isActiveTicket`, party size limit 20), `download.js` (`saveBlob`).
`mixins/formErrors.js` gives forms `errors`, `formError`, `submitting`, `clearErrors()`,
`showApiError(error, { [status]: message })` (maps field errors, `non_field_errors` to the alert,
falls back to a translated generic message). `mixins/cartMoney.js` gives cart/checkout the tax
estimate (`showTax, taxAmount, taxPercent, estimatedTotal, money()`).

### 7.6 Components
- common: `BaseButton` (variants primary|secondary|ghost|danger, sizes sm|md|lg, `loading`, `to` makes it a router-link, `block`), `BaseInput` (label, hint, error, password toggle, `show-optional`), `BaseBadge` (tones neutral|success|warning|danger|info), `BaseSpinner`, `BaseSkeleton`, `BaseModal` (native `<dialog>`), `ConfirmDialog` (focus on Cancel; props `open, title, message, confirm-label, cancel-label, danger, loading`; emits `confirm`, `cancel`), `EmptyState` (title, description, default slot for actions), `FormAlert`, `BasePagination` (`page`, `total-pages`, emits `change`), `ToastHost`, `ThemeToggle`, `LocaleSwitcher`.
- layout: `AppHeader`, `AppFooter`, `TableBanner`, `NotificationBell`.
- menu: `MenuItemCard`, `MenuFilters`. cart: `QuantityStepper`, `AddToCartButton`, `CartLink`.
- orders: `OrderTimeline`, `PaymentPanel`, `InvoiceCard`.

### 7.7 Views
`HomeView, MenuView, MenuItemView, CartView, CheckoutView, ScanView, OrdersView, OrderView,
ReservationsView, ReservationNewView, QueueView, InvoicesView, NotificationsView, AccountView,
AreaPlaceholderView (staff/admin placeholder), auth/{Login,Register,ForgotPassword,ResetPassword}View,
errors/{Forbidden,NotFound}View, dev/StyleguideView`.

### 7.8 i18n
Namespaces (one JSON per language each): `common, layout, home, auth, pages, errors, menu, cart,
checkout, orders, reservations, billing, styleguide`, merged by `locales/<lang>/index.js`.
A test enforces identical keys AND identical `{placeholders}` in `en` and `fr`, and no empty
strings. To add keys: add them in BOTH languages. To add a namespace: create both JSON files and
import them in BOTH `index.js` files. Plurals use the pipe syntax and a call such as
`$t('queue.waiting', { count: n }, n)`. Do not use keys containing a hyphen. Existing keys that
Phase 8 can reuse: `common.retry`, `common.cancel`, `common.confirm`, `errors.*`,
`orders.status.*`, `orders.types.*`, `payment.*`, `reservations.status.*`, `queue.status.*`,
`menu.pagination.*`, `menu.errorText`.

---

## 8. Patterns to copy (they are tested; stay consistent)

**List page** (copy `OrdersView.vue` / `InvoicesView.vue`): `data` has `items, count, loading, failed,
requestId`; `fetch*()` increments `requestId` and ignores stale answers; skeleton while loading,
`EmptyState` with a Retry button on failure, `EmptyState` when empty, `BasePagination` driven by
`?page=` in the route query, a `'$route.fullPath'` watcher guarded by `this.$route.name === '<name>'`.

**Form**: `mixins: [formErrors]`, `novalidate`, client-side validation first (`this.errors = {...}`),
then call the service; `catch (e) { this.showApiError(e) }`; guard `if (this.submitting) return`
at the top of `submit()` (no double submission); `BaseButton type="submit" :loading="submitting"`.

**Confirm destructive actions** with `ConfirmDialog`; success/failure feedback with the toast store.

**Live data**: `setInterval` in `mounted`, `clearInterval` in `beforeUnmount`, a `tick()` method that
does nothing when `document.hidden`; a failed refresh keeps what is on screen.

**Per-role UI**: show/hide with getters from the `auth` store (`isStaff`, `isAdmin`), but the
backend enforces permissions; routes use `meta.roles`.

**Money display**: `formatMoney(decimalString, CURRENCY, locale)`. **Dates**: `formatDateTime(iso,
locale, tz)`; calendar dates without time (`reservation.date`) use `formatDay`.

**Styling**: scoped CSS with tokens only (`var(--space-4)`, `var(--color-text-muted)`,
`var(--radius-md)`, `var(--text-sm)`, `var(--target-size)`, `var(--header-height)`, ...). Check
`tokens.css` before inventing a variable. Colours that exist for state: `--color-success|warning|danger|info`
and `-surface` variants, `--color-accent`, `--color-primary`, `--color-on-primary`.

---

## 9. Test infrastructure (must keep working)

- `tests/setup.js`: stubs `matchMedia`, `window.scrollTo`, `<dialog>` `showModal/close`; clears
  localStorage AND sessionStorage after each test.
- `tests/helpers/app.js`: `mountAt(Component, '/path', { user, props, before })` mounts inside the
  REAL router, Pinia and i18n (English), pre-sets `auth.user`, runs `before()` after the stores exist
  and before the component is created (use it to pre-fill stores), and **unmounts every component
  after each test** (a leftover mounted component made a test flaky: its re-render switched the
  active Pinia). Also exports `USERS = { client, staff, admin }`.
- `tests/helpers/http.js`: `fakeServer(handler)` replaces the Axios adapter and returns the list of
  requests; `reply(config, status, data)`, `envelope(code, message, errors)`.
- `tests/helpers/fixtures.js`: `makeOrder, makePayment, makeReservation, makeTicket, makeInvoice,
  SETTINGS, page(results, count)`.
- Mock services with `vi.spyOn(someService, 'method').mockResolvedValue(...)` (vitest config has
  `restoreMocks: true`). Wait for navigation to lazy routes with `await vi.waitFor(() => expect(router.currentRoute.value.name)...)`.
  Components with timers expose `tick()` so tests call it directly. Always add tests for: the
  happy path, validation, server error mapping, empty/loading/error states, double submission,
  accessibility attributes (names, `aria-*`), both roles where relevant.
- Router guard tests: see `tests/unit/router-guards.test.js` and `cart-routes.test.js`
  (`visit(path, user)` helper). When you add routes, add tests for access rules.
- When you change the navigation, update `tests/unit/navigation.test.js` and
  `tests/components/AppHeader.test.js` (they list the exact links per role).

---

## 10. Gotchas already paid for

- CORS: see section 4. Edit backend `.env`, restart the server.
- jsdom has no `<dialog>`, `matchMedia`, `scrollTo`, `URL.createObjectURL`: stubbed in setup or in the test.
- The stretched-link card pattern: a button inside a card needs `position: relative; z-index: 1`.
- Query-only navigations must NOT move focus (router `afterEach` only focuses `#main` when the path changes).
- `vue-i18n` v11 has no `$tc`: use `$t(key, named, pluralCount)`.
- `Intl` dates: restaurant timezone is `settings.timezone`; "today" for bookings uses `todayIn(tz)`.
- A declined payment is a 201 with `status: "failed"`, not an HTTP error.
- Backend returns the same answer for unknown emails on password reset: never reveal existence.
- Do not call `useXStore()` without a Pinia in non-component code that can run before `app.use(pinia)`.

---

## 11. Roadmap

Everything below is done. What remains is deployment, which is out of the
frontend-only scope and is documented in section 13.

- ~~**8.1 Staff: orders and payments.**~~ Done. `staffOrderService`,
  `staffPaymentService`, `StaffHomeView`, `StaffOrdersView`, `StaffOrderView`,
  `StaffOrderNewView`.
- ~~**8.2 Staff: floor.**~~ Done. `staffReservationService`,
  `staffQueueService`, `staffTableService`, `StaffReservationsView`,
  `StaffQueueView`, `StaffTablesView`.
- ~~**8.3 Admin.**~~ Done. `adminCategoryService`, `adminMenuService`,
  `adminUserService`, `adminDashboardService`, `adminReportService`,
  `AdminHomeView`, `AdminCategoriesView`, `AdminMenuView`,
  `AdminMenuItemNewView`, `AdminMenuItemEditView`, `AdminSettingsView`,
  `AdminUsersView`, `AdminUserNewView`, `AdminUserEditView`,
  `AdminDashboardView`, `AdminReportsView`.
- ~~**8.4 Profile and change-password.**~~ Done. Two extra actions on the auth
  store, `AccountNav`, `AccountProfileView`, `AccountPasswordView`.
- ~~**Phase 9 (integration pass).**~~ Done as `tests/unit/integration-nav.test.js`,
  which walks every staff and admin route for every role.
- ~~**Phase 10 (documentation).**~~ Done. Five ADRs under `docs/decisions/`,
  a rewritten `README.md`, this handoff updated, and a manual demo checklist.

When the project is deployed, the remaining work is the one described in the
old plan: static hosting with an `index.html` fallback for the history router,
`VITE_API_BASE_URL` in the frontend environment, `CORS_ALLOWED_ORIGINS`,
`FRONTEND_URL`, `ALLOWED_HOSTS` and a rotated `SECRET_KEY` on the backend,
real SMTP and a real payment gateway in place of the simulated one.

---

## 12. Anti-conflict rules

1. Never rename or remove: route names, store ids, localStorage/sessionStorage keys, i18n keys,
   service method names, component names listed above, test helper names. ADD only.
2. Before creating a file, check it does not exist. Before adding an i18n key, check the namespace.
3. Reuse existing components and helpers (section 7). Do not add a second modal, toast, button,
   pagination, money formatter or HTTP client.
4. Keep Options API. Keep `mapState/mapActions` for Pinia. Keep scoped CSS with tokens.
5. Backend is the source of truth for rules (status transitions, permissions, prices). The frontend
   only decides what to show. Do not invent endpoints: read `docs/api.md`.
6. Every change comes with tests, an updated navigation test if the navigation changed, and the
   `git add` / `git commit` block.
7. After each step the user runs lint, test and build and pastes the output; wait for it.

---

## 13. Submission checklist (user's deadline is close)

- [ ] `npm run lint`, `npm test`, `npm run build` all green in the frontend; `pytest` green in the backend.
- [ ] Both repos pushed to GitHub (`git status` clean, `git log` shows the history).
- [ ] README in both repos: what it is, stack, how to install and run, demo accounts, how to run tests.
- [ ] `docs/HANDOFF.md` kept, plus ADRs if time allows.
- [ ] Be honest in the report about the state: customer experience complete and tested; staff and
      admin screens are planned (Phase 8) while the backend already exposes and tests all of their
      features through the documented API.
- [ ] Secrets rotated before any public deployment (section 4).

---

## 14. Prompt to paste at the start of the new conversation

> You are continuing an existing project. Read the attached HANDOFF.md fully. Respond in French,
> write code in English. Follow section 3 and section 12 strictly: deliver complete files as
> copy-paste `cat > ... <<'EOF'` blocks, one `git add` + `git commit` block after each code block,
> edit existing files with assert-checked python scripts, never rename anything that exists, and
> never guess an API field: ask me to paste the relevant part of the backend `docs/api.md`. Start
> with Phase 8.1 (staff orders and payments). First tell me, in a few lines, what you understood
> and which files you will create or modify, then deliver the first files.
