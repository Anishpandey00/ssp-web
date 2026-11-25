# Requirements and traceability

Requirement IDs: **REQ-x** come from the SRS, **FR-x** from the final report and
final presentation, **NFR-x** are the design's quality requirements, and **BR-x**
are business rules. Test IDs: **TC** = manual test case, **AT** = automated unit
test (`npm test`), **CI** = pipeline check. Steps, results and owners are in the
[RTM and RACI workbook](../reports/SSP_RTM_RACI_Team_D_Final.xlsx) (final version, 2026-11-26).

## At a glance

| | Count |
|---|:-:|
| Requirements | 45 (25 functional, 3 business rules, 17 non-functional) |
| Implemented | 44 of 45 (NFR-9 is partial) |
| Requirements with at least one test | 45 of 45 |
| Test cases | 73 (44 manual, 1 CI, 28 automated) |
| Automated tests passing | 28 of 28 (`npm test`, 2026-11-26) |
| Manual and CI tests | Pending: to be run before submission |

## Functional requirements

| ID | Requirement | Implementation | API | Tests |
|---|---|---|---|---|
| REQ-1 | User can enter email and password to log in | `src/pages/Login.jsx` | — | TC-01 |
| REQ-2 | System validates the user's credentials | `services/auth-service/index.js` (bcrypt.compare, JWT sign); `src/api/backend.js` → loginUser; `src/utils/session.js` (Keep me logged in) | `POST /api/login` | TC-02, TC-36 |
| REQ-3 | System shows an error for invalid input | `src/pages/Login.jsx` (error banner) | `POST /api/login` | TC-03 |
| REQ-4 | After login the user is redirected to the dashboard | `src/pages/Login.jsx` → navigate('/dashboard') | — | TC-04 |
| FR-1 | User can register with name, email and a password of at least 6 characters | `src/pages/Signup.jsx`; `services/auth-service/index.js` | `POST /api/register` | TC-05 |
| FR-3 | User can log out from any page | `src/components/Navbar.jsx`; `src/context/AuthContext.jsx` | — | TC-06 |
| REQ-5 | Dashboard shows a greeting message | `src/pages/Dashboard.jsx` | — | TC-08 |
| REQ-6 | Dashboard shows a "Let's Begin" button | `src/pages/Dashboard.jsx` | — | TC-09 |
| REQ-7 | "Let's Begin" opens the task section | `src/pages/Dashboard.jsx` → /tasks | — | TC-09 |
| REQ-8 | User can add study tasks | `src/pages/Tasks.jsx` → addTask; `src/utils/tasks.js` (taskFormError); `services/task-service/index.js` | `POST /api/tasks/:userId` | TC-10, AT-09 |
| REQ-9 | User can delete tasks | `src/pages/Tasks.jsx` → deleteTask; `services/task-service/index.js` | `DELETE /api/tasks/:userId/:taskId` | TC-11 |
| REQ-10 | Tasks are stored in the database | `services/task-service/index.js`; `services/shared/db.js` (task_db) | — | TC-12 |
| REQ-11 | Tasks are displayed in a list | `src/pages/Tasks.jsx` (All/Pending/Completed filters); `src/utils/tasks.js` (compareTasks, dueInfo) | `GET /api/tasks/:userId` | TC-13, AT-07, AT-08 |
| FR-4 | User can edit tasks and mark them complete | `src/pages/Tasks.jsx`, `src/components/TaskRow.jsx`; `services/task-service/index.js` | `PUT /api/tasks/:userId/:taskId`; `PATCH …/toggle` | TC-14, TC-15 |
| REQ-12 | User can start a quiz | `src/pages/Quiz.jsx`; `services/quiz-service/index.js`; `services/quiz-service/data/quizzes.js` | `GET /api/quizzes` | TC-17 |
| REQ-13 | Quiz questions are displayed | `src/pages/Quiz.jsx` | `GET /api/quizzes` | TC-18 |
| REQ-14 | System evaluates the user's answers | `src/pages/Quiz.jsx` → choose | — | TC-19 |
| REQ-15 | System shows the final score | `src/pages/Quiz.jsx` (result screen) | — | TC-20 |
| REQ-16 | Completed tasks are recorded | `src/api/backend.js` → toggleTask; `services/progress-service/progress.js` | `PATCH /api/tasks/:userId/:taskId/toggle`; `GET /internal/tasks/:userId/summary` | TC-15, AT-10, AT-11 |
| REQ-17 | Quiz scores are stored | `src/api/backend.js` → saveScore; `services/quiz-service/index.js` | `POST /api/scores/:userId` | TC-21 |
| REQ-18 | Progress is displayed to the user | `src/pages/Progress.jsx`; `services/progress-service/index.js` | `GET /api/progress/:userId` | TC-22, AT-10 |
| FR-9 | Admin can create, rename and delete quizzes and add or delete questions | `src/pages/Admin.jsx`; `services/quiz-service/index.js` | `GET/POST/PUT/DELETE /api/admin/quizzes…`; `POST/DELETE …/questions` | TC-23, TC-24 |
| FR-10 | Admin can list users and grant or remove admin (not on own account) | `src/pages/Admin.jsx`; `services/auth-service/index.js` | `GET /api/admin/users`; `PATCH /api/admin/users/:userId/toggle-admin` | TC-25, TC-26 |
| FR-11 | Student can turn a study goal into 4–8 suggested tasks and choose which ones to add | `src/components/StudyPlanner.jsx`; `services/ai-service/index.js`, `study-plan.js`, `ollama.js` | `POST /api/ai/study-plan`; `POST /api/tasks/:userId` | TC-37, TC-38, AT-17–AT-20 |
| FR-12 | Dashboard shows "Today's focus": the first thing to do today and 2–3 tips from the student's own tasks and quiz scores | `src/components/StudyTips.jsx`; `src/pages/Dashboard.jsx`; `services/ai-service/study-tips.js` | `GET /api/ai/study-tips` | TC-39, AT-23, AT-24, AT-26 |

FR-2, FR-6, FR-7 and FR-8 in the final presentation are the same requirements as
REQ-2, REQ-12 to REQ-15, REQ-17 and REQ-18 (the RTM's Remarks column says which).

## Business rules

| ID | Rule | Implementation | Tests |
|---|---|---|---|
| BR-1 | Only logged-in users can use the study pages; only admins can use the admin page | `src/components/ProtectedRoute.jsx`; `services/shared/auth.js` (requireAuth) | TC-07 |
| FR-5 | Due date must be between today and 2 months ahead (form and API) | `services/shared/due-date.js`; `src/utils/dueDate.js` | TC-16, AT-01–AT-06 |
| BR-2 | AI suggestions are only suggestions: nothing is saved until the student ticks tasks and adds them, and added tasks pass the same checks as typed tasks | `src/components/StudyPlanner.jsx` (onAdd = useTasks().add); `src/hooks/useTasks.js`; `services/ai-service/study-plan.js` (cleanSuggestions) | TC-44, AT-20 |

## Non-functional requirements

| ID | Requirement | Implementation | Tests | Status |
|---|---|---|---|---|
| NFR-1 | Passwords are stored as bcrypt hashes, never in plain text | `services/auth-service/index.js`; `services/auth-service/admin-seed.js` | AT-16 | Implemented, verified by `npm test` |
| NFR-2 | Every protected request needs a valid token; students only reach their own data; admin APIs need an admin token | `services/shared/auth.js` (requireAuth, requireOwner, requireAdmin) | TC-27, TC-28 | Implemented |
| NFR-3 | No default admin account; a new admin needs explicit credentials (password 12+ characters) | `services/auth-service/admin-seed.js` | AT-13–AT-15 | Implemented, verified by `npm test` |
| NFR-4 | Database queries are parameterised to prevent SQL injection | `services/shared/db.js`; service queries use $1, $2 … | AT-16 | Implemented, verified by `npm test` |
| NFR-5 | If the Quiz service is down, login, tasks and task statistics keep working | `services/progress-service/index.js` (3 s timeout); `progress.js`; `src/pages/Progress.jsx`; `services/ai-service/index.js` (Today's focus from tasks only) | TC-29, AT-12, AT-24 | Implemented |
| NFR-6 | Every service has a health check and is restarted automatically if it fails | `docker-compose.yml` (healthcheck, restart: unless-stopped); GET /health in each service | TC-30 | Implemented |
| NFR-7 | Database sits on an internal network; only the frontend publishes a port | `docker-compose.yml` (ssp-frontend-net, ssp-backend-net internal); `docs/deployment/network.md`; `scripts/network-demo.sh` | TC-31 | Implemented |
| NFR-8 | Whole system starts with one command, in dependency order | `docker-compose.yml`; services/Dockerfile; `docker/frontend.Dockerfile`; `docker/nginx/nginx.conf` | TC-32 | Implemented |
| NFR-9 | System runs on Azure Container Apps | `deploy/azure/three-containers.sh`; `docker/frontend.azure.Dockerfile`; `docker/nginx/nginx.azure.conf` | TC-33 | **Partial**: Azure still runs the earlier 3-container version (frontend, backend, database); one Container App per service plus an AI host is the next step |
| NFR-10 | Every push and pull request is checked automatically | `.github/workflows/ci.yml` (tests, build, syntax checks, Compose check, Docker image build) | CI-01 | Implemented |
| NFR-11 | Interface is responsive and gives feedback on actions | `src/styles/index.css`; `src/context/ToastContext.jsx` | TC-34 | Implemented |
| NFR-12 | Secrets come from environment variables; services refuse to start without JWT_SECRET | `services/shared/auth.js` (jwtSecret); `.env.example` | TC-35 | Implemented |
| NFR-13 | The AI model runs locally with Ollama: no API key, no cost, and student data is not sent to an outside AI provider | `services/ai-service/ollama.js`; `docker-compose.yml` (OLLAMA_URL → host.docker.internal:11434) | TC-42 | Implemented |
| NFR-14 | AI answers are checked before use: a fixed JSON schema, facts worked out in code, bad or duplicate suggestions removed, at most 8 tasks, due dates kept inside the allowed range | `services/ai-service/study-plan.js` (cleanSuggestions); `study-tips.js` (buildFacts, cleanTips) | AT-19, AT-20, AT-21, AT-23, AT-25, AT-27 | Implemented, verified by `npm test` |
| NFR-15 | Fair use of the AI: per student, one plan request at a time, at most 5 plans and 10 new tips per minute | `services/ai-service/rate-limit.js`; `services/ai-service/index.js` | TC-41, AT-22 | Implemented |
| NFR-16 | If the AI model is off, slow or not installed, the app keeps working: the study plan shows a clear message, Today's focus uses tips written in code, and the AI service stays healthy | `services/ai-service/ollama.js` (120 s / 60 s time limits); `study-tips.js` (ruleTips); `docker/nginx/nginx.conf` (150 s for /api/ai) | TC-40, AT-26 | Implemented |
| NFR-17 | Today's focus never slows the Dashboard: it loads on its own, and AI tips are cached until the student's tasks or scores change (up to 6 hours) | `src/components/StudyTips.jsx`; `services/ai-service/study-tips.js` (createTipsCache) | TC-43, AT-28 | Implemented |
