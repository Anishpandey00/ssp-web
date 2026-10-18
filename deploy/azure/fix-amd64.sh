#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

RG="ssp-rg"
ACR="sspwebacrd605a8"
PG_SERVER="ssp-db-d605a8"
PG_DB="smart_study_planner"
PG_USER="sspdbadmin"
CA_ENV="ssp-env"
BACKEND_APP="ssp-backend"
FRONTEND_APP="ssp-frontend"

NEW_PG_PASS="SspDb$(openssl rand -hex 10)"
JWT_SECRET=$(openssl rand -hex 32)

ACR_SERVER=$(az acr show --name "$ACR" --query loginServer -o tsv)
ACR_USER=$(az acr credential show --name "$ACR" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR" --query "passwords[0].value" -o tsv)
PG_HOST="${PG_SERVER}.postgres.database.azure.com"

echo "==> Resetting PostgreSQL password..."
az postgres flexible-server update \
  --resource-group "$RG" \
  --name "$PG_SERVER" \
  --admin-password "$NEW_PG_PASS" \
  -o none
echo "    Done"

echo "==> Logging Docker into ACR..."
az acr login --name "$ACR"

echo "==> Building backend image for linux/amd64..."
docker buildx build --platform linux/amd64 \
  -t "${ACR_SERVER}/ssp-backend:latest" \
  -f Dockerfile \
  --push \
  .
echo "    ssp-backend:latest pushed (amd64)"

echo "==> Building frontend image for linux/amd64..."
docker buildx build --platform linux/amd64 \
  -t "${ACR_SERVER}/ssp-frontend:latest" \
  -f Dockerfile.frontend.azure \
  --push \
  .
echo "    ssp-frontend:latest pushed (amd64)"

echo "==> Removing failed backend Container App (if exists)..."
az containerapp delete \
  --name "$BACKEND_APP" \
  --resource-group "$RG" \
  --yes 2>/dev/null || true

echo "==> Deploying backend Container App..."
az containerapp create \
  --name "$BACKEND_APP" \
  --resource-group "$RG" \
  --environment "$CA_ENV" \
  --image "${ACR_SERVER}/ssp-backend:latest" \
  --registry-server "$ACR_SERVER" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --target-port 4000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    NODE_ENV=production \
    PORT=4000 \
    DB_HOST="$PG_HOST" \
    DB_PORT=5432 \
    DB_USER="$PG_USER" \
    DB_PASSWORD="$NEW_PG_PASS" \
    DB_NAME="$PG_DB" \
    JWT_SECRET="$JWT_SECRET" \
  -o none

BACKEND_FQDN=$(az containerapp show \
  --name "$BACKEND_APP" --resource-group "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "    Backend: https://$BACKEND_FQDN"

echo "==> Deploying frontend Container App..."
az containerapp create \
  --name "$FRONTEND_APP" \
  --resource-group "$RG" \
  --environment "$CA_ENV" \
  --image "${ACR_SERVER}/ssp-frontend:latest" \
  --registry-server "$ACR_SERVER" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars "BACKEND_URL=https://${BACKEND_FQDN}" \
  -o none

FRONTEND_FQDN=$(az containerapp show \
  --name "$FRONTEND_APP" --resource-group "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)

cat > deploy/azure/.deployed.env <<EOF
FRONTEND_URL=https://$FRONTEND_FQDN
BACKEND_URL=https://$BACKEND_FQDN
RESOURCE_GROUP=$RG
ACR=$ACR_SERVER
PG_SERVER=$PG_SERVER
PG_HOST=$PG_HOST
PG_USER=$PG_USER
EOF

echo ""
echo "============================================="
echo " DEPLOYMENT COMPLETE!"
echo "============================================="
echo " Frontend : https://$FRONTEND_FQDN"
echo " Backend  : https://$BACKEND_FQDN"
echo "============================================="
