# Restaurant frontend

Vue 3 single-page application (Options API only) for the restaurant table, queue and online
ordering system. It talks to the Django REST API of the `restaurant-backend` repository.

## Requirements

Node 22.13 or newer (or 24+) and npm.

## Setup

    npm install
    cp .env.example .env
    npm run dev

The app runs on http://localhost:5173. The backend only accepts this exact origin, so the
dev server refuses to start on another port.

## Scripts

- `npm run dev`: development server
- `npm run build`: production build in `dist/`
- `npm run preview`: serve the production build locally
- `npm test`: unit and component tests (Vitest)
- `npm run lint`: ESLint

## Rules of the project

- Options API only. ESLint rejects `<script setup>`, `setup()` and Composition API imports.
- Every colour, size and motion value comes from `src/assets/styles/tokens.css`.
- Mobile first: styles start from the smallest screen and grow with `min-width` queries.
