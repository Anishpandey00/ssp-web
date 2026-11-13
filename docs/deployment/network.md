# How the six containers are networked (local Docker)

Everything below is defined in [`docker-compose.yml`](../../docker-compose.yml).
Run `bash scripts/network-demo.sh` to prove each point live.

```
                  Your laptop (browser)
                          │
          localhost:3000  │ (the only published port)
                          ▼
 ┌──────────────────────── ssp-frontend-net ─────────────────────────┐
 │                                                                    │
 │                ssp-frontend (nginx :80) = API gateway              │
 │      /api/login…     /api/tasks/…    /api/progress/…   /api/quizzes…│
 │          │                │                 │                │     │
 │          ▼                ▼                 ▼                ▼     │
 │     auth-service     task-service ◄── progress-service ──► quiz-service
 │       :4000            :4000      HTTP    :4000      HTTP   :4000  │
 └──────────│────────────────│──────────────────────────────────│─────┘
            │ auth, task and quiz are on BOTH networks           │
 ┌──────────│──────── ssp-backend-net · internal ───────────────│─────┐
 │          ▼                ▼                                  ▼     │
 │                     ssp-db (PostgreSQL :5432)                      │
 │              auth_db          task_db          quiz_db              │
 └────────────────────────────────────────────────────────────────────┘
          no published port · no internet access
```

## Key ideas

| Idea | Where it is in the code |
|---|---|
| **Network** = a private virtual switch (Docker `bridge`). Containers on it get a private IP and can talk to each other. | `networks:` at the bottom of `docker-compose.yml` |
| **Service discovery**: Docker's built-in DNS lets a container reach another by its *service name*. | `set $task_service http://task-service:4000` in [`nginx.conf`](../../nginx.conf), `TASK_SERVICE_URL` for progress-service, `DB_HOST: db` |
| **API gateway**: nginx sends each `/api/...` path to the one service that owns it. | the `location` blocks in `nginx.conf` |
| **Segmentation**: the frontend and progress-service are not on `backend-net`, so they cannot reach the database at all. Only auth, task and quiz, which join both networks, can. | `networks:` under each service |
| **Database per service**: one PostgreSQL server, but each service opens only its own database. | `AUTH_DB_NAME`, `TASK_DB_NAME`, `QUIZ_DB_NAME` |
| **Internal network**: `internal: true` gives `backend-net` no route to the internet. | `backend-net:` → `internal: true` |
| **Port publishing**: only the gateway publishes a port (`3000→80`). The services and the db have no `ports:`. | `ports:` under frontend |

## Request flow (Progress page)

1. Browser → `localhost:3000/api/progress/<id>` → Docker forwards to **ssp-frontend** port 80.
2. nginx matches `/api/progress/` and proxies to `http://progress-service:4000` over **ssp-frontend-net**.
3. **progress-service** checks the login token, then calls `task-service` and `quiz-service` at the same time, passing the token along.
4. Each of them checks the token and reads only its own database (`task_db`, `quiz_db`) over **ssp-backend-net**.
5. progress-service combines the answers. If quiz-service is down, it still returns the task numbers and marks scores as unavailable.

## Same idea on Azure (not migrated yet)

Azure still runs the earlier three-container version. Moving it to this design
means one Container App per service with **internal** ingress, the database
keeping internal TCP ingress, and only the frontend with **external** ingress.
