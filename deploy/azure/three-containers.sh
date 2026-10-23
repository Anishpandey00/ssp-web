#!/bin/bash
set -euo pipefail

# Three Container Apps (frontend, backend, Postgres) in one standard
# (WorkloadProfiles) environment. Express environments reject TCP ingress,
# which the Postgres container needs.
#
# Run from the repo root: bash deploy/azure/three-containers.sh
# Credentials come from .env.azure-db (gitignored), created on first run.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

RG="ssp-rg"
LOCATION="koreacentral"
CA_ENV="ssp-env-std"
ACR="sspwebacrd605a8"
ACR_SERVER="${ACR}.azurecr.io"
BACKEND_IMAGE="${ACR_SERVER}/ssp-backend:v7"
FRONTEND_IMAGE="${ACR_SERVER}/ssp-frontend:v6"
DB_APP="ssp-db"
BACKEND_APP="ssp-backend"
FRONTEND_APP="ssp-frontend"
CREDS=".env.azure-db"

if [ ! -f "$CREDS" ]; then
  umask 077
  printf 'DB_USER=postgres\nDB_NAME=smart_study_planner\nDB_PASSWORD=SspDb%s\nJWT_SECRET=%s\n' \
    "$(openssl rand -hex 12)" "$(openssl rand -hex 32)" > "$CREDS"
fi
# shellcheck disable=SC1090
source "$CREDS"

exists() { az containerapp show -n "$1" -g "$RG" -o none 2>/dev/null; }

# ── Environment (standard, not Express) ───────────────────────────────────────
if ! az containerapp env show -n "$CA_ENV" -g "$RG" -o none 2>/dev/null; then
  echo "==> Creating environment '$CA_ENV'..."
  az containerapp env create -n "$CA_ENV" -g "$RG" -l "$LOCATION" \
    --environment-mode WorkloadProfiles -o none
fi

# ── Container 1: PostgreSQL (internal TCP only) ───────────────────────────────
if ! exists "$DB_APP"; then
  echo "==> Creating '$DB_APP'..."
  az containerapp create -n "$DB_APP" -g "$RG" --environment "$CA_ENV" \
    --image docker.io/library/postgres:16-alpine \
    --ingress internal --transport tcp --target-port 5432 --exposed-port 5432 \
    --min-replicas 1 --max-replicas 1 --cpu 0.5 --memory 1.0Gi \
    --secrets pgpass="$DB_PASSWORD" \
    --env-vars POSTGRES_PASSWORD=secretref:pgpass POSTGRES_USER="$DB_USER" \
      POSTGRES_DB="$DB_NAME" PGDATA=/var/lib/postgresql/data/pgdata \
    -o none
fi

ACR_PASS=$(az acr credential show -n "$ACR" --query "passwords[0].value" -o tsv)

# ── Container 2: Backend (reaches Postgres at ssp-db:5432, no SSL) ───────────
if ! exists "$BACKEND_APP"; then
  echo "==> Creating '$BACKEND_APP'..."
  az containerapp create -n "$BACKEND_APP" -g "$RG" --environment "$CA_ENV" \
    --image "$BACKEND_IMAGE" \
    --registry-server "$ACR_SERVER" --registry-username "$ACR" --registry-password "$ACR_PASS" \
    --target-port 4000 --ingress external --min-replicas 1 --max-replicas 3 \
    --cpu 0.25 --memory 0.5Gi \
    --secrets dbpass="$DB_PASSWORD" jwt="$JWT_SECRET" \
    --env-vars NODE_ENV=production PORT=4000 DB_HOST="$DB_APP" DB_PORT=5432 DB_SSL=false \
      DB_USER="$DB_USER" DB_NAME="$DB_NAME" DB_PASSWORD=secretref:dbpass JWT_SECRET=secretref:jwt \
    -o none
fi
BACKEND_FQDN=$(az containerapp show -n "$BACKEND_APP" -g "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)

# ── Container 3: Frontend ─────────────────────────────────────────────────────
if ! exists "$FRONTEND_APP"; then
  echo "==> Creating '$FRONTEND_APP'..."
  az containerapp create -n "$FRONTEND_APP" -g "$RG" --environment "$CA_ENV" \
    --image "$FRONTEND_IMAGE" \
    --registry-server "$ACR_SERVER" --registry-username "$ACR" --registry-password "$ACR_PASS" \
    --target-port 80 --ingress external --min-replicas 1 --max-replicas 3 \
    --cpu 0.25 --memory 0.5Gi \
    --env-vars "BACKEND_URL=https://${BACKEND_FQDN}" \
    -o none
fi
FRONTEND_FQDN=$(az containerapp show -n "$FRONTEND_APP" -g "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)

echo ""
echo " Frontend : https://$FRONTEND_FQDN"
echo " Backend  : https://$BACKEND_FQDN"
echo " Database : $DB_APP:5432 (internal only)"
