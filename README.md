# Smart Study Planner (Web)

A web-based study planner built with **React + Vite**, implementing the
Software Requirements Specification (SRS). Students can register/log in, manage
study tasks, take quizzes, and track their progress.

The backend is a **mock backend** (`src/api/mockBackend.js`) that simulates a
server + database using `localStorage`. Every call is async and Promise-based,
so it can be swapped for a real REST API later without changing the UI.

## Tech stack

- React 18 + Vite
- React Router for navigation
- Real backend API server with SQLite database
- Fonts: Fraunces (display) + Outfit (body)

## Requirements

- Node.js 18+ and npm

## Setup & run

```bash
npm install
npm run server
npm run dev
```

Run the backend server on port 4000, then start the Vite frontend. Vite is configured to proxy `/api` requests to the backend.

Vite prints a local URL (default http://localhost:5173) and opens it.

Build for production:

```bash
npm run build
npm run preview
```

## How to use

1. On first run, click **Sign up** to create an account (data is stored locally).
2. Log in → you land on the **Dashboard** with a greeting and a **Let's Begin** button.
3. Add and manage tasks, take a quiz, and view your progress.

## Project structure

```
ssp-web/
├── index.html
├── package.json
├── vite.config.js
├── .vscode/                  editor settings + extension recommendations
└── src/
    ├── main.jsx              app entry
    ├── App.jsx               routes
    ├── api/mockBackend.js    simulated server + database
    ├── context/AuthContext.jsx
    ├── components/           Navbar, ProtectedRoute
    ├── data/quizzes.js       seeded quiz questions
    ├── pages/                Login, Dashboard, Tasks, Quiz, Progress
    └── styles/index.css      design system
```

## SRS requirements traceability

| Requirement                      | Where it is implemented                         |
| -------------------------------- | ----------------------------------------------- |
| REQ-1 enter email & password     | `pages/Login.jsx`                               |
| REQ-2 validate credentials       | `api/mockBackend.js` → `loginUser`              |
| REQ-3 error on invalid input     | `pages/Login.jsx` (error banner)                |
| REQ-4 redirect to dashboard      | `pages/Login.jsx` → `navigate('/dashboard')`    |
| REQ-5 greeting message           | `pages/Dashboard.jsx`                           |
| REQ-6 "Let's Begin" button       | `pages/Dashboard.jsx`                           |
| REQ-7 button opens task section  | `pages/Dashboard.jsx` → `/tasks`                |
| REQ-8 add tasks                  | `pages/Tasks.jsx` → `addTask`                   |
| REQ-9 delete tasks               | `pages/Tasks.jsx` → `deleteTask`                |
| REQ-10 tasks stored in database  | `api/mockBackend.js` (localStorage)             |
| REQ-11 tasks displayed in a list | `pages/Tasks.jsx`                               |
| REQ-12 start a quiz              | `pages/Quiz.jsx`                                |
| REQ-13 questions displayed       | `pages/Quiz.jsx`                                |
| REQ-14 evaluate answers          | `pages/Quiz.jsx` → `choose`                     |
| REQ-15 show final score          | `pages/Quiz.jsx` (result screen)                |
| REQ-16 completed tasks recorded  | `mockBackend.js` → `toggleTask` / `getProgress` |
| REQ-17 quiz scores stored        | `mockBackend.js` → `saveScore`                  |
| REQ-18 progress displayed        | `pages/Progress.jsx`                            |
| Business rule: login required    | `components/ProtectedRoute.jsx`                 |

## Notes

- "Database" persists in your browser's localStorage. Clearing site data resets it.
- To reset the demo, run in the browser console: `localStorage.clear()`.
