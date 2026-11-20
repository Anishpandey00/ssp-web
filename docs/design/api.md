# API reference

All requests go through the gateway at `/api/...` on the frontend's origin
(http://localhost:3000 with Docker). Bodies are JSON.

## Conventions

- **Authentication:** send `Authorization: Bearer <token>`. The token comes from
  `/api/register` or `/api/login` and is valid for 7 days.
- **Access levels:**
  - *Public*: no token.
  - *User*: any valid token.
  - *Owner*: valid token **and** `:userId` must be the caller's own ID.
  - *Admin*: valid token with admin rights.
- **Responses:** every response has `ok: true | false`. Failures carry an `error` message.
  - `401` missing or invalid token · `403` not the owner / not an admin
  - Validation errors return `200` with `ok: false` (the UI shows `error` as is),
    except the AI service, which uses `400`, `429`, `502` and `503`.
- **Health:** `GET /api/health` answers from the gateway; each service also has `GET /health`
  (not routed by the gateway).

## Auth service

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| POST | `/api/register` | Public | `name`, `email`, `password` (6+ chars) | `user`, `token` |
| POST | `/api/login` | Public | `email`, `password` | `user`, `token` |
| GET | `/api/admin/users` | Admin | — | `users` |
| PATCH | `/api/admin/users/:userId/toggle-admin` | Admin | — | `user` (cannot change own status) |

## Task service

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| GET | `/api/tasks/:userId` | Owner | — | `tasks` |
| POST | `/api/tasks/:userId` | Owner | `title`, `subject?`, `dueDate?`, `priority?` | `task` |
| PUT | `/api/tasks/:userId/:taskId` | Owner | same as POST | `task` |
| PATCH | `/api/tasks/:userId/:taskId/toggle` | Owner | — | `tasks` |
| DELETE | `/api/tasks/:userId/:taskId` | Owner | — | `tasks` |

`priority` is `HIGH`, `MEDIUM` (default) or `LOW`. `dueDate` (`YYYY-MM-DD`) must
be between today and two months ahead; an unchanged date on edit stays valid.

## Quiz service

| Method | Path | Access | Body | Returns |
|---|---|---|---|---|
| GET | `/api/quizzes` | User | — | `quizzes` with questions |
| POST | `/api/scores/:userId` | Owner | `quizId`, `score` (integer) | `entry` |
| GET | `/api/admin/quizzes` | Admin | — | `quizzes` |
| POST | `/api/admin/quizzes` | Admin | `title`, `description?` | `quiz` |
| PUT | `/api/admin/quizzes/:quizId` | Admin | `title`, `description` | `quiz` |
| DELETE | `/api/admin/quizzes/:quizId` | Admin | — | — |
| POST | `/api/admin/quizzes/:quizId/questions` | Admin | `text`, `options`, `answerIndex` | `question` |
| DELETE | `/api/admin/quizzes/:quizId/questions/:questionId` | Admin | — | — |

## Progress service

| Method | Path | Access | Returns |
|---|---|---|---|
| GET | `/api/progress/:userId` | Owner | `progress`: task totals and quiz statistics; scores are marked unavailable if the Quiz service is down |

## AI service

| Method | Path | Access | Body / query | Returns |
|---|---|---|---|---|
| POST | `/api/ai/study-plan` | User | `goal` (up to 500 chars), `today?` | `tasks`: 4–8 suggestions (nothing is saved) |
| GET | `/api/ai/study-tips` | User | `?fresh=1` for new tips | `focus`, `tips`, `source` (`ai` or `rules`) |

Limits: one study-plan request at a time per student and five per minute; ten
new tips per minute.

## Internal endpoints

Called between services only; the gateway never routes them.

| Method | Path | Service | Used by |
|---|---|---|---|
| GET | `/internal/tasks/:userId/summary` | task-service | progress-service |
| GET | `/internal/scores/:userId` | quiz-service | progress-service, ai-service |

The caller forwards the student's own token, so the owner check still applies.
