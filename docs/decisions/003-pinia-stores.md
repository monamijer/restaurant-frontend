# 003 — What goes in a Pinia store

## Context

The application has a lot of shared state: the signed-in user, the cart, the
notification bell, the restaurant settings, the UI theme and language. Some
of it has to survive navigation; some of it is per page.

## Decision

A piece of state becomes a **Pinia store** when it is read by more than one
route **and** it has to stay consistent across them:

| Store | Why it is a store |
|---|---|
| `auth` | Read by the header, every guard and every page. |
| `cart` | Read by the header, the cart page, the checkout and the scan flow. |
| `notifications` | Polled by the header and shown by the notifications page. |
| `restaurant` | Read by the header, the home page, the reservation form and the checkout. |
| `ui` | Theme and locale follow the visitor between pages. |
| `toasts` | One queue, one host, any page can push. |
| `menu` | Categories are cached for the filters and the cart. |
| `table` | The scanned table has to survive a reload of the menu page. |

Everything else stays **local to the component** (`data`). In particular, list
pages keep their own `items`, `loading`, `failed` and `requestId`: the request
lifecycle and the stale-response guard are easier to read when they live next
to the template that uses them.

Stores are written in the options style (`state`, `getters`, `actions`) and
consumed with `mapState` and `mapActions`, for consistency with the Options
API decision (ADR 001).

## Consequences

- The number of stores stays small: one per cross-cutting concern.
- A list page can be copied into a new route without dragging a store with it.
- Two pages that need the same list (for example, the admin list and the
  staff list of orders) still call their own service: the store is not used as
  a cache by default.
