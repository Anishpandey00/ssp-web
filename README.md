# Smart Study Planner (Web)

A web-based study planner built with **React + Vite**, implementing the
Software Requirements Specification (SRS). Students can register/log in, manage
study tasks, take quizzes, and track their progress.

The backend is split into **four microservices**. Docker runs six containers:
an Nginx frontend that also acts as the API gateway, the Auth, Task, Quiz and
Progress services (each a small Express app), and PostgreSQL holding one
database per service.

## Tech stack

- React 18 + Vite, served by Nginx in Docker
- Four Express microservices + PostgreSQL 16 (one database per service)
- Nginx as the API gateway
- React Router for navigation
- Fonts: Fraunces (display) + Outfit (body)

## Run with Docker

Install Docker with Docker Compose, then run from the cloned repository:

```bash
cp .env.example .env
```

Edit `.env` to set `DB_PASSWORD` and a long random `JWT_SECRET`. If `.env` already
exists, update it instead of overwriting it. Then build and start all six containers:

```bash
docker compose up -d --build --wait
docker compose ps
```

Open http://localhost:3000 (or the host port configured by `FRONTEND_PORT` in `.env`).
Set `FRONTEND_PORT` in `.env` to change the frontend address. It defaults to 3000
and is the only port Docker publishes; the services are reached through it.
Save `.env`, then run `docker compose up -d --wait` to apply a port change; no rebuild
is needed for port changes.

| Container | Purpose | Database |
| --- | --- | --- |
| `ssp-frontend` | Nginx serves React and is the API gateway: it sends each `/api/...` path to the service that owns it. The only published port: http://localhost:3000 by default. | none |
| `ssp-auth` | `auth-service`: sign up, log in, admin user management. Issues the login token. | `auth_db` (users) |
| `ssp-task` | `task-service`: study tasks. | `task_db` (tasks) |
| `ssp-quiz` | `quiz-service`: quizzes, questions, saved scores, admin quiz editing. | `quiz_db` (quizzes, questions, scores) |
| `ssp-progress` | `progress-service`: Dashboard and Progress numbers. Calls Task and Quiz at the same time. | none |
| `ssp-db` | PostgreSQL holding the three service databases. Internal `db:5432`; no published port. | |

| Request path | Goes to |
| --- | --- |
| `/api/register`, `/api/login`, `/api/admin/users/...` | auth-service |
| `/api/tasks/...` | task-service |
| `/api/quizzes`, `/api/scores/...`, `/api/admin/quizzes/...` | quiz-service |
| `/api/progress/...` | progress-service |

Every service checks the login token itself with the shared `JWT_SECRET`; none
of them calls the Auth service to do it. If the Quiz service stops, login, tasks
and the dashboard's task numbers keep working, and Docker restarts it.

If Docker reports that a host port is already allocated, set `FRONTEND_PORT`
in `.env` to an available port, then rerun `docker compose up -d --wait`.

Compose starts the containers in four waves: PostgreSQL; then Auth, Task and
Quiz once it is healthy; then Progress once Task and Quiz are healthy; then the
frontend once all four services are healthy. Each service creates its own
database and tables on startup, and the Quiz service loads the starter quizzes.
For a new database, optionally set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` in
`.env` before starting. Use a unique password of at least 12 characters. No default
administrator password is created. Existing administrator accounts are preserved.
The frontend calls `/api` on its own origin; Nginx forwards each request to the
service that owns its path on the Docker network. The services do not serve
frontend files. The database is reachable only from the Auth, Task and Quiz
services; it does not publish a host port.
Data persists in the `ssp-db-data` volume, including after containers are stopped.
For an existing volume, keep its original database credentials: changing `.env`
does not change the password stored in PostgreSQL.

**Moving data from the old single backend.** A volume created before the split
holds everything in `smart_study_planner`. After the first `docker compose up`,
copy it into the service databases once (the old database is only read):

```bash
bash scripts/migrate-to-microservices.sh --yes
```

```bash
# View logs of every service
docker compose logs -f

# Check the gateway, and each service's own health check
curl http://localhost:3000/api/health
docker compose ps

# Stop one service and watch the rest keep working, then start it again
docker compose stop quiz-service
docker compose start quiz-service

# Open a database shell
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d task_db'

# Stop containers while preserving database data
docker compose down
```

`docker compose down -v` deletes the database volume and all its data.

## Local development

With Node.js and a running PostgreSQL database, configure `.env` for that database
(`DB_HOST=localhost`), then run the four services and the frontend in separate terminals:

```bash
npm ci
npm ci --prefix services
npm run server
npm run dev
```

`npm run server` starts Auth on port 4001, Task on 4002, Quiz on 4003 and
Progress on 4004. Vite serves the frontend at http://localhost:5173 and sends
each `/api` path to the service that owns it, like Nginx does in Docker.
For a production build, `npm run build` generates `dist`. In Docker, the frontend
image copies this output into Nginx; each service image (built from
`services/Dockerfile` with `--build-arg SERVICE=...`) holds the shared code and
only its own service folder. `npm run preview` can preview a standalone frontend build,
but use `npm run dev` or the Docker stack for the configured API proxy.

## Azure deployment

The app currently deployed on Azure Container Apps is still the earlier
three-container version (`ssp-frontend`, `ssp-backend`, `ssp-db`), created by
`bash deploy/azure/three-containers.sh`; the database accepts internal TCP
connections only. The current URLs are in `deploy/azure/.deployed.env`.
Moving Azure to the four services (internal ingress for each, the frontend's
`nginx.azure.conf` routing to them) is a separate, not yet done step.

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
├── docs/deployment/         container network guide
├── public/                  static images
├── scripts/                 network demo, data migration
├── services/                the four microservices
│   ├── shared/              Express setup, token checks, database pool
│   ├── auth-service/        sign up, log in, admin users      (auth_db)
│   ├── task-service/        study tasks, due-date rule        (task_db)
│   ├── quiz-service/        quizzes, scores, starter quizzes  (quiz_db)
│   ├── progress-service/    dashboard numbers from Task + Quiz
│   ├── Dockerfile           one image per service (--build-arg SERVICE)
│   └── package.json         the services' dependencies
├── src/
│   ├── main.jsx             React entry point
│   ├── App.jsx              page routes
│   ├── api/backend.js       REST API client
│   ├── context/             authentication state
│   ├── components/          shared interface components
│   ├── pages/               student and admin pages
│   └── styles/              shared styles
├── tests/                   admin seeding, due dates, tasks, progress
├── .env.example             configuration template; copy to .env
├── Dockerfile.frontend      React build + Nginx frontend image (local)
├── Dockerfile.frontend.azure  frontend image for Azure (backend URL from env)
├── docker-compose.yml       the six containers and their networks
├── nginx.conf               frontend serving and API gateway (local)
├── nginx.azure.conf         frontend for the current Azure (single backend)
├── index.html               frontend HTML entry
├── package.json             dependencies and commands
├── package-lock.json        dependency lockfile
├── vite.config.js           frontend build and development settings
└── README.md                setup and project guide
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
| REQ-10 tasks stored in database  | `services/task-service` (`task_db`)     |
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
