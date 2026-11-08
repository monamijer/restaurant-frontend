# 🍽️ Restaurant Frontend

<p align="center">
  <strong>A modern restaurant management and online ordering platform.</strong>
  <br />
  Built with Vue 3, Vite and Pinia.
</p>

<p align="center">
  <a href="https://vuejs.org/">
    <img src="https://img.shields.io/badge/Vue.js-3.5-42b883?logo=vuedotjs&logoColor=white" alt="Vue 3.5" />
  </a>
  <a href="https://vite.dev/">
    <img src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" alt="Vite 8" />
  </a>
  <a href="https://pinia.vuejs.org/">
    <img src="https://img.shields.io/badge/State-Pinia-yellow?logo=pinia&logoColor=white" alt="Pinia" />
  </a>
  <a href="https://vitest.dev/">
    <img src="https://img.shields.io/badge/Tests-Vitest-6e9f18?logo=vitest&logoColor=white" alt="Vitest" />
  </a>
  <img src="https://img.shields.io/badge/i18n-English%20%7C%20French-blue" alt="Internationalization" />
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  </a>
</p>

---

## 📖 Overview

**Restaurant Frontend** is a responsive web application designed to simplify restaurant operations and enhance the customer experience.

Built with Vue 3 and Vite, it provides an intuitive interface for customers, restaurant staff and administrators.

The application integrates with the Django REST API provided by [`restaurant-backend`](https://github.com/monamijer/restaurant-backend).

### ✨ Key Features

- **Digital Menu** — Browse restaurant menus and available products.
- **Online Ordering** — Add items to the cart and complete orders online.
- **Table Reservations** — Book restaurant tables through the application.
- **Queue Management** — Manage customer queues and waiting lists.
- **Staff Dashboard** — Dedicated interface for restaurant employees.
- **Admin Dashboard** — Administrative tools for managing restaurant operations.
- **Multilingual Support** — English and French translations.
- **Responsive Design** — Mobile-first interface adapted to different screen sizes.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Vue 3.5 | Frontend framework |
| Vite 8 | Development server and build tool |
| Pinia | State management |
| Vue Router | Application navigation |
| Vitest | Unit testing |
| ESLint | Code quality and linting |
| i18n | Internationalization |
| Django REST Framework | Backend API |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) 22.13+
- npm
- The [Restaurant Backend](https://github.com/monamijer/restaurant-backend) running locally.

The backend must allow requests from:

`http://localhost:5173`

Configure `CORS_ALLOWED_ORIGINS` accordingly.

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/monamijer/restaurant-frontend.git
cd restaurant-frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Set `VITE_API_BASE_URL` if your backend API is not available at:

`http://localhost:8000/api`

**4. Start the development server**

```bash
npm run dev
```

The application will be available at:

`http://localhost:5173`

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate a production build |
| `npm test` | Run the Vitest test suite |
| `npm run lint` | Run ESLint checks |

---

## 🔐 Demo Accounts

To access the demo environment, first run the following command in the backend project:

```bash
python manage.py seed_demo
```

All demo accounts use the following password:

`Demo-Passw0rd!`

| Email | Role |
|---|---|
| `admin@demo.example` | Administrator |
| `server@demo.example` | Restaurant Staff |
| `client1@demo.example` | Customer |

> **Note:** These credentials are intended exclusively for local development and demonstration purposes.

---

## 📐 Development Conventions

The project follows consistent development standards to maintain code quality and readability.

- Vue 3 Options API.
- Pinia Options Stores.
- No semicolons.
- Single quotes.
- No `v-html`.
- Mobile-first responsive design.
- Scoped CSS using design tokens.
- Identical internationalization keys across English and French.

For additional technical documentation:

- [Development Handoff](docs/HANDOFF.md)
- [Architecture & Technical Decisions](docs/decisions/)

---

## 🔗 Related Project

**Backend Repository:** [restaurant-backend](https://github.com/monamijer/restaurant-backend)

Built with Django REST Framework.

---

## 📄 License

This project is distributed under the **MIT License**.

<p align="center">
  <a href="LICENSE" title="View the full MIT License">
    <img
      src="https://img.shields.io/badge/View-MIT%20License-green?style=for-the-badge&logo=opensourceinitiative&logoColor=white"
      alt="Click to view the MIT License"
    />
  </a>
  <br />
  <sub>Click the badge to view the full license.</sub>
</p>

<p align="center">
  © 2026 <strong>Monami Jerome</strong>
  <br />
  Developed with dedication.
</p>
