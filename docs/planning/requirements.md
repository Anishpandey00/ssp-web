# Requirements and traceability

Requirement IDs: **REQ-x** come from the SRS, **FR-x** from the final report,
**NFR-x** are the design's quality requirements, and **BR-x** are business rules.
Test IDs: **TC** = manual test case, **AT** = automated unit test (`npm test`),
**CI** = pipeline check. Steps, results and owners are in the
[RTM and RACI workbook](../reports/SSP_RTM_RACI_Team_D_fixed.xlsx).

## Functional requirements

| ID | Requirement | Implementation | API | Tests |
|---|---|---|---|---|
| REQ-1 | User can enter email and password to log in | `src/pages/Login.jsx` | — | TC-01 |
| REQ-2 | System validates the user's credentials | `services/auth-service/index.js`; `src/api/backend.js` → `loginUser` | `POST /api/login` | TC-02 |
| REQ-3 | System shows an error for invalid input | `src/pages/Login.jsx` (error banner) | `POST /api/login` | TC-03 |
| REQ-4 | After login the user is redirected to the dashboard | `src/pages/Login.jsx` → `navigate('/dashboard')` | — | TC-04 |
| FR-1 | User can register with name, email and a password of at least 6 characters | `src/pages/Signup.jsx`; `services/auth-service/index.js` | `POST /api/register` | TC-05 |
| FR-3 | User can log out from any page | `src/components/Navbar.jsx`; `src/context/AuthContext.jsx` | — | TC-06 |
| REQ-5 | Dashboard shows a greeting message | `src/pages/Dashboard.jsx` | — | TC-08 |
| REQ-6 | Dashboard shows a "Let's Begin" button | `src/pages/Dashboard.jsx` | — | TC-09 |
| REQ-7 | "Let's Begin" opens the task section | `src/pages/Dashboard.jsx` → `/tasks` | — | TC-09 |
| REQ-8 | User can add study tasks | `src/pages/Tasks.jsx`; `src/utils/tasks.js`; `services/task-service/index.js` | `POST /api/tasks/:userId` | TC-10, AT-09 |
| REQ-9 | User can delete tasks | `src/pages/Tasks.jsx`; `services/task-service/index.js` | `DELETE /api/tasks/:userId/:taskId` | TC-11 |
| REQ-10 | Tasks are stored in the database | `services/task-service/index.js` (`task_db`) | — | TC-12 |
| REQ-11 | Tasks are displayed in a list | `src/pages/Tasks.jsx` (All / Pending / Completed); `src/utils/tasks.js` | `GET /api/tasks/:userId` | TC-13, AT-07, AT-08 |
| FR-4 | User can edit tasks and mark them complete | `src/pages/Tasks.jsx`; `src/components/TaskRow.jsx` | `PUT /api/tasks/:userId/:taskId`, `PATCH …/toggle` | TC-14, TC-15 |
| REQ-12 | User can start a quiz | `src/pages/Quiz.jsx`; `services/quiz-service/` | `GET /api/quizzes` | TC-17 |
| REQ-13 | Quiz questions are displayed | `src/pages/Quiz.jsx` | `GET /api/quizzes` | TC-18 |
| REQ-14 | System evaluates the user's answers | `src/pages/Quiz.jsx` → `choose` | — | TC-19 |
| REQ-15 | System shows the final score | `src/pages/Quiz.jsx` (result screen) | — | TC-20 |
| REQ-16 | Completed tasks are recorded | `src/api/backend.js` → `toggleTask`; `services/progress-service/progress.js` | `PATCH /api/tasks/:userId/:taskId/toggle` | TC-15, AT-10, AT-11 |
| REQ-17 | Quiz scores are stored | `src/api/backend.js` → `saveScore`; `services/quiz-service/index.js` | `POST /api/scores/:userId` | TC-21 |
| REQ-18 | Progress is displayed to the user | `src/pages/Progress.jsx`; `services/progress-service/index.js` | `GET /api/progress/:userId` | TC-22, AT-10 |
| FR-9 | Admin can create, rename and delete quizzes and add or delete questions | `src/pages/Admin.jsx`; `services/quiz-service/index.js` | `/api/admin/quizzes…` | TC-23, TC-24 |
| FR-10 | Admin can list users and grant or remove admin (not on their own account) | `src/pages/Admin.jsx`; `services/auth-service/index.js` | `/api/admin/users…` | TC-25, TC-26 |
| AI-1 | Student can turn a goal into suggested study tasks and choose which to add | `src/components/StudyPlanner.jsx`; `services/ai-service/study-plan.js` | `POST /api/ai/study-plan` | `tests/study-plan.test.js` |
| AI-2 | Dashboard shows "Today's focus" study tips based on tasks and quiz scores | `src/components/StudyTips.jsx`; `services/ai-service/study-tips.js` | `GET /api/ai/study-tips` | `tests/study-tips.test.js` |

## Business rules

| ID | Rule | Implementation | Tests |
|---|---|---|---|
| BR-1 | Only logged-in users can use the study pages; only admins can use the admin page | `src/components/ProtectedRoute.jsx`; `services/shared/auth.js` | TC-07 |
| FR-5 | A due date must be between today and two months ahead (form and API) | `services/shared/due-date.js`; `src/utils/dueDate.js` | TC-16, AT-01 to AT-06 |

## Non-functional requirements

| ID | Requirement | Implementation | Status |
|---|---|---|---|
| NFR-1 | Passwords are stored as bcrypt hashes | `services/auth-service/` | Implemented, verified by `npm test` |
| NFR-2 | Every protected request needs a valid token; students reach only their own data; admin APIs need an admin token | `services/shared/auth.js` (`requireAuth`, `requireOwner`, `requireAdmin`) | Implemented |
| NFR-3 | No default admin account; a new admin needs explicit credentials (12+ character password) | `services/auth-service/admin-seed.js` | Implemented, verified by `npm test` |
| NFR-4 | Database queries are parameterised | `services/shared/db.js`; `$1, $2 …` in every query | Implemented |
| NFR-5 | If the Quiz service is down, login, tasks and task statistics keep working | `services/progress-service/` (3 s timeout, partial answer) | Implemented |
| NFR-6 | Every service has a health check and restarts automatically | `docker-compose.yml`; `GET /health` | Implemented |
| NFR-7 | The database is on an internal network; only the frontend publishes a port | `docker-compose.yml`; [network guide](../deployment/network.md) | Implemented |
| NFR-8 | The whole system starts with one command, in dependency order | `docker-compose.yml` | Implemented |
| NFR-9 | The system runs on Azure Container Apps | `deploy/azure/three-containers.sh` | **Partial**: Azure runs the earlier three-container version |
| NFR-10 | Every push and pull request is checked automatically | `.github/workflows/ci.yml` | Implemented |
| NFR-11 | The interface is responsive and gives feedback on actions | `src/styles/index.css`; `src/context/ToastContext.jsx` | Implemented |
