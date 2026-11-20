# Contributing

Thanks for helping improve Smart Study Planner.

## Getting set up

Follow [Running locally](docs/deployment/local.md). Docker is the quickest way
to run the whole system; `npm run server` + `npm run dev` is handier while
changing code.

## Workflow

1. Open an issue (bug report or feature request) or pick an existing one.
2. Create a branch from `main`: `feature/<short-name>`, `fix/<short-name>` or `docs/<short-name>`.
3. Make the change, with tests where it makes sense.
4. Run the checks locally:
   ```bash
   npm test
   npm run build
   docker compose config --quiet
   ```
5. Open a pull request using the template. The **Project checks** workflow must pass.

## Guidelines

- **Keep services independent.** A service reads only its own database. Get
  another service's data over HTTP (see `services/shared/call-service.js`).
- **Check access in every route.** Use `requireAuth`, plus `requireOwner` for
  `:userId` routes or `requireAdmin` for admin routes.
- **Parameterise every query** (`$1, $2, …`); never build SQL from input.
- **Validate on both sides.** Rules such as the due-date range live in shared
  code used by the form and the API.
- **Never commit secrets.** Configuration goes in `.env` (git-ignored); add new
  settings to `.env.example` with a placeholder.
- **Update the docs** in `docs/` and the requirement table when behaviour changes.

## Commit messages

Use a short imperative subject (e.g. *Add quiz timer*), a blank line, then what
changed and why.
