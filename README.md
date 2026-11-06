# Restaurant Frontend

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest-6e9f18?logo=vitest&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20FR-blue)

Vue 3 app for restaurant **table, queue and online ordering**: menu, cart, reservations, checkout, plus staff and admin areas. It talks to the Django REST API of [`restaurant-backend`](https://github.com/monamijer/restaurant-backend).

## Quick start

Requires Node 22.13+ and the backend running with `CORS_ALLOWED_ORIGINS` containing `http://localhost:5173`.

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if the API is not on http://localhost:8000/api
npm run dev            # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm test` | Vitest suite |
| `npm run lint` | ESLint |

## Demo accounts

After `python manage.py seed_demo` in the backend, password `Demo-Passw0rd!`:

| Email | Role |
| --- | --- |
| `admin@demo.example` | admin |
| `server@demo.example` | staff |
| `client1@demo.example` | client |

## Conventions

Options API only, Pinia options stores, no semicolons, single quotes, no `v-html`, mobile-first scoped CSS on design tokens, identical i18n keys in EN and FR.

More in [`docs/HANDOFF.md`](docs/HANDOFF.md) and [`docs/decisions/`](docs/decisions/).

---

<p align="center">
  Released under the <a href="LICENSE">MIT License</a> · © 2026 Monami Jerome
</p>
