# Changelog

Notable changes to Smart Study Planner, newest first.

## 2026-11 · Microservices and AI

### Added
- AI service (fifth microservice) using a local Ollama model.
  - **Plan my study with AI** on the Tasks page turns a goal into suggested tasks.
  - **Today's focus** on the Dashboard gives tips based on tasks and quiz scores, with rule-based tips when the AI is offline.
- Requirement traceability matrix, RACI matrix, presentations and final reports in `docs/`.
- Project documentation: planning, design, implementation and deployment guides.
- MIT license, contributing guide, security policy, issue and pull request templates, Dependabot.

### Changed
- Backend split into Auth, Task, Quiz and Progress microservices, each with its own database.
- nginx frontend now acts as the API gateway.
- Frontend Dockerfiles and nginx configs moved into `docker/`.

## 2026-10 · Containers and Azure

### Added
- Separate Docker containers for the frontend, backend and PostgreSQL.
- Azure Container Apps deployment with three apps (frontend, backend, PostgreSQL).
- Explicit Docker networks with an internal data network, and a network demo script.
- Due dates limited to today through two months ahead, on the form and the API.
- GitHub Actions checks for tests, build and Compose validation.

### Changed
- Redesigned welcome, login, sign-up and navigation; shared icon set.

### Fixed
- Task, quiz and login bugs; stale pages after a new deploy.

## 2026-06 · First version

### Added
- React + Vite frontend with login, dashboard, tasks, quizzes and progress.
- Express backend with JWT authentication and PostgreSQL storage.
- Admin panel for quizzes and users.
