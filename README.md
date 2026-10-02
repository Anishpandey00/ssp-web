# Smart Study Planner (Web)

A web-based study planner built with **React + Vite**, implementing the
Software Requirements Specification (SRS). Students can register/log in, manage
study tasks, take quizzes, and track their progress.

The backend is an Express REST API backed by PostgreSQL. In Docker, the backend
and database run in separate containers; Express also serves the built React frontend.

## Tech stack

- React 18 + Vite
- Express + PostgreSQL 16
- React Router for navigation
- Fonts: Fraunces (display) + Outfit (body)

## Run with Docker

Install Docker with Docker Compose, then run from the cloned repository:

```bash
cp .env.example .env
```

Edit `.env` to set `DB_PASSWORD` and a long random `JWT_SECRET`. If `.env` already
exists, update it instead of overwriting it. Then start both containers:

```bash
docker compose up -d --build
docker compose ps
```

Open http://localhost:4000 (or the host port configured by `PORT` in `.env`).

- `ssp-backend`: Express API and built React frontend on container port 4000.
- `ssp-db`: PostgreSQL on container port 5432, reachable by the backend at `db`.

Compose waits for PostgreSQL to become healthy before starting the backend.
Database tables and initial quizzes are created automatically on backend startup.
The database is accessible inside the Docker network; it does not publish a host port.
Data persists in the `ssp-db-data` volume, including after containers are stopped.
For an existing volume, keep its original database credentials: changing `.env`
does not change the password stored in PostgreSQL.

```bash
# View logs
docker compose logs -f backend db

# Open a database shell
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Stop containers while preserving database data
docker compose down
```

`docker compose down -v` deletes the database volume and all its data.

## Local development

With Node.js and a running PostgreSQL database, configure `.env` for that database
(`DB_HOST=localhost`), then run the backend and frontend in separate terminals:

```bash
npm ci
npm run server
npm run dev
```

Vite serves the frontend at http://localhost:5173 and proxies `/api` to port 4000.
For production, `npm run build` generates the frontend that Express serves.

## How to use

1. On first run, click **Sign up** to create an account (data is stored in PostgreSQL).
2. Log in → you land on the **Dashboard** with a greeting and a **Let's Begin** button.
3. Add and manage tasks, take a quiz, and view your progress.

## Project structure

```
ssp-web/
├── index.html
├── package.json
├── vite.config.js
├── .vscode/                  editor settings + extension recommendations
└── src/
    ├── main.jsx              app entry
    ├── App.jsx               routes
    ├── api/backend.js        REST API client
    ├── context/AuthContext.jsx
    ├── components/           Navbar, ProtectedRoute
    ├── data/quizzes.js       seeded quiz questions
    ├── pages/                Login, Dashboard, Tasks, Quiz, Progress
    └── styles/index.css      design system
```

## SRS requirements traceability

| Requirement                      | Where it is implemented                         |
| -------------------------------- | ----------------------------------------------- |
| REQ-1 enter email & password     | `pages/Login.jsx`                               |
| REQ-2 validate credentials       | `api/backend.js` → `loginUser`              |
| REQ-3 error on invalid input     | `pages/Login.jsx` (error banner)                |
| REQ-4 redirect to dashboard      | `pages/Login.jsx` → `navigate('/dashboard')`    |
| REQ-5 greeting message           | `pages/Dashboard.jsx`                           |
| REQ-6 "Let's Begin" button       | `pages/Dashboard.jsx`                           |
| REQ-7 button opens task section  | `pages/Dashboard.jsx` → `/tasks`                |
| REQ-8 add tasks                  | `pages/Tasks.jsx` → `addTask`                   |
| REQ-9 delete tasks               | `pages/Tasks.jsx` → `deleteTask`                |
| REQ-10 tasks stored in database  | `server/db.js` (PostgreSQL)             |
| REQ-11 tasks displayed in a list | `pages/Tasks.jsx`                               |
| REQ-12 start a quiz              | `pages/Quiz.jsx`                                |
| REQ-13 questions displayed       | `pages/Quiz.jsx`                                |
| REQ-14 evaluate answers          | `pages/Quiz.jsx` → `choose`                     |
| REQ-15 show final score          | `pages/Quiz.jsx` (result screen)                |
| REQ-16 completed tasks recorded  | `backend.js` → `toggleTask` / `getProgress` |
| REQ-17 quiz scores stored        | `backend.js` → `saveScore`                  |
| REQ-18 progress displayed        | `pages/Progress.jsx`                            |
| Business rule: login required    | `components/ProtectedRoute.jsx`                 |

## Notes

User accounts, tasks, quizzes, and scores are stored in PostgreSQL.
