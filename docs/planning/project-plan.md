# Project plan

Smart Study Planner (SSP) is a Team D university project: a cloud-native web
application that helps students plan study tasks, test themselves with quizzes
and follow their progress.

## Objectives

1. Implement every requirement in the Software Requirements Specification (SRS),
   traced from requirement to code to test ([requirements](requirements.md)).
2. Build it as a set of independently deployable microservices behind one API gateway.
3. Run the whole system with one command (Docker Compose) and on Azure Container Apps.
4. Check every push and pull request automatically (GitHub Actions).
5. Add useful, privacy-friendly AI assistance that runs on a local model.

## Scope

**In scope:** student accounts, study tasks, quizzes and scores, progress
statistics, an admin panel for quizzes and users, an AI study plan and study
tips, Docker and Azure deployment, CI, documentation.

**Out of scope:** native mobile apps, email or push notifications, social
features, payments, and a hosted AI model (the AI features use Ollama on the
host machine).

## Phases and milestones

| # | Phase | Main deliverables | Completed |
|---|---|---|---|
| 1 | Requirements and planning | SRS, project plan, team roles (RACI) | Jun 2026 |
| 2 | First working version | React frontend, Express backend, PostgreSQL; login, tasks, quizzes, progress | Jun 2026 |
| 3 | Containerisation | Dockerfiles, Docker Compose, separate database container | Oct 2026 |
| 4 | UI redesign | New welcome, login, sign-up and navigation; shared icon set | Oct 2026 |
| 5 | Cloud deployment | Three Container Apps on Azure (frontend, backend, PostgreSQL); explicit Docker networks | Oct 2026 |
| 6 | Quality pass | Due-date rule on form and API, bug fixes, toasts and feedback | Oct 2026 |
| 7 | Microservices | Backend split into Auth, Task, Quiz and Progress services with one database each; nginx API gateway | Nov 2026 |
| 8 | AI features | AI service: study plan on the Tasks page, "Today's focus" tips on the Dashboard | Nov 2026 |
| 9 | Documentation and delivery | RTM and RACI workbook, final report, slides, live demo | Nov 2026 |

The full commit history on GitHub shows each step.

## Current status

| Area | Status |
|---|---|
| Functional requirements (SRS and final report) | Implemented |
| Local Docker deployment (seven containers) | Implemented |
| Automated checks (unit tests, build, Compose validation) | Passing in CI |
| Azure deployment | **Partial**: Azure still runs the earlier three-container version. Moving it to the microservices is planned (see [Azure deployment](../deployment/azure.md)). |
| Manual test cases (TC-01 to TC-35) | Tracked in the [RTM and RACI workbook](../reports/SSP_RTM_RACI_Team_D_fixed.xlsx) |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| One service fails and takes the app down | High | Each service has a health check and restarts automatically; Progress still returns task numbers when the Quiz service is down |
| Leaked secrets | High | Secrets only in `.env` (git-ignored); no default admin password; a new admin needs a 12+ character password |
| Unauthorised access to another student's data | High | Every service checks the login token and that the user owns the data; admin routes need an admin token |
| The database is reachable from outside | High | PostgreSQL sits on an internal Docker network with no published port |
| AI gives wrong or invented suggestions | Medium | Facts are worked out in code; the model only phrases them; students review suggestions before adding them |
| Local AI model is slow or not running | Low | Rate limits, a longer gateway timeout, and tips written in code when Ollama is off |
| Azure has no GPU on the standard plan | Low | AI features stay on the local deployment for now |

## Ways of working

- `main` holds the working version; larger changes go through a branch and pull request.
- Every push to `main` and every pull request runs the **Project checks** workflow.
- Requirements, owners and test results are kept up to date in the RTM workbook.
- Roles and responsibilities are listed in [Team and RACI](team-and-raci.md).
