# Frontend implementation

React 18 single-page app built with Vite and routed with React Router.

```text
src/
├── main.jsx                 entry point
├── App.jsx                  routes and providers
├── api/backend.js           REST client: one function per API call, adds the token
├── context/
│   ├── AuthContext.jsx      current user and token, login / logout
│   └── ToastContext.jsx     success and error toasts
├── hooks/useTasks.js        loads and updates the task list
├── components/
│   ├── Navbar.jsx           navigation and logout
│   ├── ProtectedRoute.jsx   login and admin guard
│   ├── TaskRow.jsx          one task with edit, toggle and delete
│   ├── StudyPlanner.jsx     "Plan my study with AI" panel
│   ├── StudyTips.jsx        "Today's focus" card
│   └── Icon.jsx             shared icon set
├── pages/                   Welcome, Login, Signup, Dashboard, Tasks, Quiz, Progress, Admin
├── utils/
│   ├── dueDate.js           client copy of the due-date rule
│   ├── tasks.js             sorting, labels and form validation
│   └── session.js           login session in session or local storage
└── styles/index.css         design tokens and shared styles
```

## Notes

- **One API client.** Pages never call `fetch` directly; they use
  `src/api/backend.js`, which sends requests to `/api` on the same origin.
- **Same origin in every setup.** In Docker, nginx routes `/api` to the services.
  With `npm run dev`, the Vite proxy in `vite.config.js` does the same.
- **Validation on both sides.** The task form uses the same due-date rule as
  the Task service, so most mistakes are caught before a request is sent.
- **AI parts load on their own.** The tips card and planner panel never delay
  the rest of the page, and show a friendly message when the AI is offline.
