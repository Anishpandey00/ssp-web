# Backend implementation

The backend is five small Express services in [`services/`](../../services).
They share one `package.json` and a `shared/` folder, and each one is built into
its own image.

```text
services/
├── shared/
│   ├── app.js            Express setup, CORS, async error handling, /health, start-up
│   ├── auth.js           requireAuth, requireOwner, requireAdmin (JWT checks)
│   ├── db.js             PostgreSQL pool; creates the service's database if missing
│   ├── due-date.js       the "today to two months ahead" rule
│   └── call-service.js   service-to-service HTTP call with timeout, forwards the token
├── auth-service/         index.js, admin-seed.js
├── task-service/         index.js
├── quiz-service/         index.js, data/quizzes.js (starter quizzes)
├── progress-service/     index.js, progress.js (combines the answers)
├── ai-service/           index.js, ollama.js, study-plan.js, study-tips.js, rate-limit.js
├── Dockerfile            one image per service (--build-arg SERVICE=...)
└── package.json
```

## Service shape

Every service follows the same pattern:

1. `createService()` returns an Express app with JSON parsing, CORS headers and
   async handlers whose errors reach the error handler instead of crashing the process.
2. Routes are added with the shared `requireAuth` / `requireOwner` / `requireAdmin` guards.
3. `startService(app, { name, port, init })` adds `/health`, the 404 and error
   handlers, runs `init` (create the database and tables, seed data) and listens.
   If start-up fails the process exits, and Docker or Azure restarts it.

## Per service

**auth-service**: Validates sign-up input, stores bcrypt hashes (cost 10) and
issues a 7-day JWT containing `id`, `name`, `email` and `isAdmin`. Emails are
normalised to lower case. `admin-seed.js` creates an administrator only when
both `ADMIN_EMAIL` and a 12+ character `ADMIN_PASSWORD` are set, and never
changes existing administrators.

**task-service**: CRUD for a student's tasks. `parseTask` checks the title
(required, up to 300 chars), subject, priority and the due-date rule. On edit an
unchanged past date stays valid. Toggle and delete return the updated list.

**quiz-service**: Serves quizzes with their questions in order, saves scores
(title and total come from the database, not the request), and gives admins
full quiz and question editing. Loads the starter quizzes into an empty database.

**progress-service**: No database. Calls Task and Quiz at the same time with
the student's own token and combines the answers in `progress.js`. If Quiz
fails, it still returns the task numbers and marks scores as unavailable.

**ai-service**: No database. Talks to Ollama's `/api/chat` with a JSON schema
so answers have a fixed shape.

- *Study plan*: the prompt includes a calendar so the model copies due dates
  rather than calculating them; suggestions are cleaned and checked with the
  shared due-date rule.
- *Study tips*: facts (overdue and soon-due tasks, busiest subject, weakest and
  best quiz) are worked out in code; the model only phrases them. Answers are
  cached per student until the facts change. If Ollama is off or busy, rule-based
  tips are returned instead.
- `rate-limit.js` allows one study-plan request at a time per student and five
  per minute, and ten new tips per minute.

## Configuration

All settings come from environment variables (see [`.env.example`](../../.env.example)):

| Variable | Used by | Purpose |
|---|---|---|
| `JWT_SECRET` | all | Signs and verifies login tokens (must be the same everywhere) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | auth, task, quiz | PostgreSQL connection |
| `AUTH_DB_NAME`, `TASK_DB_NAME`, `QUIZ_DB_NAME` | auth, task, quiz | Each service's own database |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | auth | Optional first administrator |
| `TASK_SERVICE_URL`, `QUIZ_SERVICE_URL` | progress, ai | Where to reach Task and Quiz |
| `OLLAMA_URL`, `OLLAMA_MODEL` | ai | Ollama address and model (default `qwen2.5:7b`) |
| `PORT` | all | Listening port (4000 in Docker; 4001–4005 with `npm run server`) |
