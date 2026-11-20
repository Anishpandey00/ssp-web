# Running locally

## With Docker (recommended)

Requirements: Docker with Docker Compose. Optional: [Ollama](https://ollama.com)
for the AI features.

```bash
cp .env.example .env
```

Edit `.env`: set `DB_PASSWORD` and a long random `JWT_SECRET`. To create an
administrator on a new database, also set `ADMIN_EMAIL` and a unique
`ADMIN_PASSWORD` of at least 12 characters (no default admin exists).

```bash
docker compose up -d --build --wait
docker compose ps
```

Open http://localhost:3000. `FRONTEND_PORT` in `.env` changes the port; apply it
with `docker compose up -d --wait` (no rebuild needed).

### Containers

| Container | Purpose | Database |
|---|---|---|
| `ssp-frontend` | nginx: serves React and routes `/api/...` to the services. The only published port. | — |
| `ssp-auth` | Sign up, log in, admin user management | `auth_db` |
| `ssp-task` | Study tasks | `task_db` |
| `ssp-quiz` | Quizzes, questions, scores, admin quiz editing | `quiz_db` |
| `ssp-progress` | Dashboard and Progress numbers from Task and Quiz | — |
| `ssp-ai` | AI study plan and study tips via Ollama on the host | — |
| `ssp-db` | PostgreSQL 16 with the three service databases; no published port | — |

Compose starts them in waves: PostgreSQL and AI; then Auth, Task and Quiz once
the database is healthy; then Progress; then the gateway once all services are
healthy. Each service creates its own database and tables on start-up.

### Everyday commands

```bash
docker compose logs -f                                        # follow all logs
docker compose stop quiz-service                              # stop one service
docker compose start quiz-service                             # start it again
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d task_db'   # database shell
docker compose down                                           # stop, keep data
```

`docker compose down -v` also deletes the `ssp-db-data` volume and all data.
For an existing volume keep the original database credentials: changing `.env`
does not change the password stored in PostgreSQL.

### Upgrading from the single-backend version

A volume created before the microservices split holds everything in
`smart_study_planner`. After the first `docker compose up`, copy it into the
service databases once (the old database is only read):

```bash
bash scripts/migrate-to-microservices.sh --yes
```

## AI features (Ollama)

Install Ollama natively (on a Mac, Docker cannot use the GPU) and download the
model once (about 4.7 GB):

```bash
brew install ollama
brew services start ollama
ollama pull qwen2.5:7b
```

The `ai-service` container reaches it at `http://host.docker.internal:11434`;
`npm run server` uses `http://localhost:11434`. Override with `OLLAMA_URL` or
`OLLAMA_MODEL` in `.env`. Without Ollama the rest of the app works normally and
the AI panels say the assistant is offline. The first answer after Ollama starts
can take up to a minute while the model loads.

## Without Docker

Requirements: Node.js 22 and a running PostgreSQL. Set `DB_HOST=localhost` in
`.env`, then run each line in its own terminal (the first two once):

```bash
npm ci
npm ci --prefix services
npm run server
npm run dev
```

`npm run server` starts Auth on 4001, Task on 4002, Quiz on 4003, Progress on
4004 and AI on 4005. Vite serves the app at http://localhost:5173 and proxies
each `/api` path to the right service, as nginx does in Docker.

## Troubleshooting

| Problem | Fix |
|---|---|
| "port is already allocated" | Set `FRONTEND_PORT` in `.env` to a free port and rerun `docker compose up -d --wait` |
| A service keeps restarting | `docker compose logs <service>`; usually a missing `JWT_SECRET` or wrong database password |
| AI panel says offline | Check `ollama list` shows the model and that Ollama is running |
