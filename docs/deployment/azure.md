# Azure deployment

## Current deployment

Azure Container Apps runs the **earlier three-container version** of the app in
one standard (Workload Profiles) environment:

| Container App | Image | Ingress |
|---|---|---|
| `ssp-frontend` | `ssp-frontend` (built from `docker/frontend.azure.Dockerfile`) | External HTTPS |
| `ssp-backend` | `ssp-backend` (single Express backend) | External HTTPS |
| `ssp-db` | `postgres:16-alpine` | Internal TCP only |

The standard environment is needed because Express-plan environments do not
allow the TCP ingress PostgreSQL uses.

**Known limitation:** the PostgreSQL container has no persistent volume, so a
restart or new revision starts with an empty database.

### Deploy or update

Requirements: Azure CLI (`az login`), images pushed to the project's Azure
Container Registry.

```bash
docker build -f docker/frontend.azure.Dockerfile -t <acr>.azurecr.io/ssp-frontend:vN .
docker push <acr>.azurecr.io/ssp-frontend:vN
bash deploy/azure/three-containers.sh
```

Always use a new version tag (`:v7`, `:v8`, …) rather than `:latest`, so Container
Apps creates a new revision. The script creates database credentials in
`.env.azure-db` (git-ignored) on first run and writes the live URLs to
`deploy/azure/.deployed.env` (also git-ignored).

The Azure frontend uses `docker/nginx/nginx.azure.conf`, an nginx template that
reads `BACKEND_URL` when the container starts.

## Planned: microservices on Azure

Not done yet. Moving Azure to the current design means:

1. One Container App per service (auth, task, quiz, progress, ai) with **internal** ingress.
2. The database keeps internal TCP ingress; only the frontend has **external** ingress.
3. `nginx.azure.conf` routes each `/api/...` path to its service, like the local `nginx.conf`.
4. The AI service needs an Ollama server Azure can reach. Container Apps on the
   standard plan have no GPU, so a local model there would be slow.
