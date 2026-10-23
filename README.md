# Smart Study Planner (Web)

A web-based study planner built with **React + Vite**, implementing the
Software Requirements Specification (SRS). Students can register/log in, manage
study tasks, take quizzes, and track their progress.

Docker runs three separate containers: an Nginx frontend serving React, an
Express REST API backend, and a PostgreSQL database.

## Tech stack

- React 18 + Vite, served by Nginx in Docker
- Express + PostgreSQL 16
- React Router for navigation
- Fonts: Fraunces (display) + Outfit (body)

## Run with Docker

Install Docker with Docker Compose, then run from the cloned repository:

```bash
cp .env.example .env
```

Edit `.env` to set `DB_PASSWORD` and a long random `JWT_SECRET`. If `.env` already
exists, update it instead of overwriting it. Then build and start all three containers:

```bash
docker compose up -d --build --wait
docker compose ps
```

Open http://localhost:3000 (or the host port configured by `FRONTEND_PORT` in `.env`).
Set `FRONTEND_PORT` in `.env` to change the frontend address. It defaults to 3000
and is independent of `PORT`, which controls the backend during local development.
Save `.env`, then run `docker compose up -d --wait` to apply a port change; no rebuild
is needed for port changes.

| Container | Purpose | Address |
| --- | --- | --- |
| `ssp-frontend` | Nginx serves React and forwards `/api/...` requests to Express. | http://localhost:3000 by default; container port 80 |
| `ssp-backend` | Express API for accounts, tasks, quizzes, and progress. | http://localhost:9001/api/health by default; container port 4000 |
| `ssp-db` | PostgreSQL stores application data. | Internal `db:5432`; no published host port |

If Docker reports that a host port is already allocated, set `FRONTEND_PORT` or
`BACKEND_PORT` in `.env` to an available port, then rerun `docker compose up -d --wait`.

Compose waits for PostgreSQL to become healthy before starting the backend.
It then waits for the backend health check before starting the frontend.
Database tables and initial quizzes are created automatically on backend startup.
For a new database, optionally set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` in
`.env` before starting. Use a unique password of at least 12 characters. No default
administrator password is created. Existing administrator accounts are preserved.
The frontend calls `/api` on its own origin; Nginx forwards these requests to
`http://backend:4000` on the Docker network. The backend does not serve frontend files.
The database is accessible inside the Docker network; it does not publish a host port.
Data persists in the `ssp-db-data` volume, including after containers are stopped.
For an existing volume, keep its original database credentials: changing `.env`
does not change the password stored in PostgreSQL.

```bash
# View logs
docker compose logs -f frontend backend db

# Check the frontend-to-backend connection (use your configured frontend port)
curl http://localhost:3000/api/health

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
For a production build, `npm run build` generates `dist`. In Docker, the frontend
image copies this output into Nginx; the backend image contains only the API and
database seed data. `npm run preview` can preview a standalone frontend build,
but use `npm run dev` or the Docker stack for the configured API proxy.

## Azure deployment

The app runs on Azure Container Apps as three container apps (`ssp-frontend`,
`ssp-backend`, `ssp-db`) in one environment. `bash deploy/azure/three-containers.sh`
creates them; the database accepts internal TCP connections only.
The current URLs are in `deploy/azure/.deployed.env`.

See [the network guide](docs/deployment/network.md) for how the containers are
connected, and run `bash scripts/network-demo.sh` to check it live.

## Verification

```bash
npm test
npm run build
docker compose config --quiet
```

GitHub Actions runs these source checks on pushes and pull requests. Passing them
does not replace checking the running containers and the application's main flows.

## How to use

1. On first run, click **Sign up** to create an account (data is stored in PostgreSQL).
2. Log in → you land on the **Dashboard** with a greeting and a **Let's Begin** button.
3. Add and manage tasks, take a quiz, and view your progress.

## Project structure

```text
ssp-web/
├── .github/workflows/        automated project checks
├── deploy/azure/            Azure Container Apps deployment script
├── docs/
│   ├── deployment/          container network guide
│   ├── presentations/       UI mockups and final presentation
│   └── reports/             thesis and team submission links
├── public/                  static images
├── scripts/                 repository maintenance scripts
├── server/
│   ├── index.js             Express API routes and startup
│   ├── db.js                database connection and initialization
│   ├── admin-seed.js        optional administrator creation
│   └── data/quizzes.js      initial quiz data
├── src/
│   ├── main.jsx             React entry point
│   ├── App.jsx              page routes
│   ├── api/backend.js       REST API client
│   ├── context/             authentication state
│   ├── components/          shared interface components
│   ├── pages/               student and admin pages
│   └── styles/              shared styles
├── tests/                   administrator initialization regression tests
├── .env.example             configuration template; copy to .env
├── Dockerfile               Express backend image
├── Dockerfile.frontend      React build + Nginx frontend image (local)
├── Dockerfile.frontend.azure  frontend image for Azure (backend URL from env)
├── docker-compose.yml       frontend, backend, and database services
├── nginx.conf               frontend serving and API proxy (local)
├── nginx.azure.conf         same, for Azure
├── index.html               frontend HTML entry
├── package.json             dependencies and commands
├── package-lock.json        dependency lockfile
├── vite.config.js           frontend build and development settings
└── README.md                setup and project guide
```

The two UI mockup presentations are retained as separate versions:
`SSP_UI_Mockup_All_Pages.pptx` and `SSP_UI_Mockup_Alternative.pptx`.
Their contents differ; neither was discarded.

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
