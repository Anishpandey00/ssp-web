# How the three containers are networked (local Docker)

Everything below is defined in [`docker-compose.yml`](../../docker-compose.yml).
Run `bash scripts/network-demo.sh` to prove each point live.

```
            Your laptop (browser)
                    │
       localhost:3000 │ (published port)
                    ▼
 ┌─────────────── ssp-frontend-net  172.20.0.0/16 ───────────────┐
 │                                                                │
 │   ssp-frontend (nginx :80)  ── /api/ ──►  ssp-backend (:4000)  │
 │        172.20.0.3            http://backend:4000   172.20.0.2  │
 └────────────────────────────────────────────────│───────────────┘
                                                  │ backend is on
                                                  │ BOTH networks
 ┌─────────────── ssp-backend-net  172.19.0.0/16 ─│─ internal ────┐
 │                                                ▼               │
 │                ssp-backend  ──── db:5432 ────►  ssp-db          │
 │                172.19.0.3                       (Postgres)      │
 │                                                 172.19.0.2      │
 └────────────────────────────────────────────────────────────────┘
          no published port · no internet access
```

## Key ideas

| Idea | Where it is in the code |
|---|---|
| **Network** = a private virtual switch (Docker `bridge`). Containers on it get a private IP and can talk to each other. | `networks:` at the bottom of `docker-compose.yml` |
| **Service discovery**: Docker has a built-in DNS server, so a container reaches another by its *service name* instead of an IP. | `DB_HOST: db` (backend), `proxy_pass http://backend:4000` in [`nginx.conf`](../../nginx.conf) |
| **Segmentation**: the frontend and db share no network, so the frontend cannot reach the db at all. Only the backend, which joins both, can. | `networks:` under each service |
| **Internal network**: `internal: true` gives `backend-net` no route to the internet, so the db can't call out. | `backend-net:` → `internal: true` |
| **Port publishing**: only `ports:` are reachable from your laptop: frontend `3000→80`, backend `9001→4000`. The db has no `ports:`. | `ports:` under frontend/backend |

## Request flow

1. Browser → `localhost:3000` → Docker forwards to **ssp-frontend** port 80.
2. nginx serves the React app; calls to `/api/...` are proxied to `http://backend:4000` over **ssp-frontend-net**.
3. **ssp-backend** queries Postgres at `db:5432` over **ssp-backend-net**.
4. The response travels back the same way.

## Showing it in VS Code

- Open `docker-compose.yml` and `nginx.conf` side by side, and point to `networks:`, `DB_HOST: db` and `proxy_pass`.
- Use the **Container Tools** (Docker) extension sidebar: under **Networks**, right-click `ssp-frontend-net` or `ssp-backend-net` and choose **Inspect** to see the connected containers and their IPs.
- In the terminal: `bash scripts/network-demo.sh`.

## Same idea on Azure

| Local Docker | Azure Container Apps |
|---|---|
| `ssp-frontend-net` / `ssp-backend-net` | the environment `ssp-env-std` |
| service name `db` | app name `ssp-db` |
| `ports:` | ingress **external** |
| no `ports:` | ingress **internal** (TCP 5432) |
