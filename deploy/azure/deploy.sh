#!/bin/bash
set -euo pipefail

# Run from the repo root: bash deploy/azure/deploy.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

# ── Config ────────────────────────────────────────────────────────────────────
RG="ssp-rg"
LOCATION="koreacentral"
SUFFIX=$(openssl rand -hex 3)
ACR="sspwebacr${SUFFIX}"
PG_SERVER="ssp-db-${SUFFIX}"
PG_DB="smart_study_planner"
PG_USER="sspdbadmin"
PG_PASS="SspDb$(openssl rand -hex 10)"
JWT_SECRET=$(openssl rand -hex 32)
CA_ENV="ssp-env"
BACKEND_APP="ssp-backend"
FRONTEND_APP="ssp-frontend"

echo ""
echo "============================================="
echo " Smart Study Planner — Azure Deployment"
echo "============================================="
echo " Resource Group : $RG"
echo " Location       : $LOCATION"
echo " ACR            : $ACR"
echo " PostgreSQL     : $PG_SERVER"
echo "============================================="
echo ""

# ── Install extensions & register providers ───────────────────────────────────
echo "==> Installing Azure Container Apps extension..."
az extension add --name containerapp --upgrade --yes 2>/dev/null || true

echo "==> Registering resource providers (skipped if already registered)..."
az provider register --namespace Microsoft.ContainerRegistry --wait -o none 2>/dev/null || true
az provider register --namespace Microsoft.App --wait -o none 2>/dev/null || true
az provider register --namespace Microsoft.DBforPostgreSQL --wait -o none 2>/dev/null || true
az provider register --namespace Microsoft.OperationalInsights --wait -o none 2>/dev/null || true

# ── Resource Group ────────────────────────────────────────────────────────────
echo "==> Creating resource group '$RG'..."
az group create --name "$RG" --location "$LOCATION" -o none

# ── Azure Container Registry ──────────────────────────────────────────────────
echo "==> Creating Azure Container Registry '$ACR'..."
az acr create --resource-group "$RG" --name "$ACR" --sku Basic --admin-enabled true -o none

ACR_SERVER=$(az acr show --name "$ACR" --query loginServer -o tsv)
ACR_USER=$(az acr credential show --name "$ACR" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR" --query "passwords[0].value" -o tsv)

echo "    Registry: $ACR_SERVER"

# ── PostgreSQL Flexible Server ────────────────────────────────────────────────
echo "==> Creating PostgreSQL Flexible Server (takes ~3-5 min)..."
az postgres flexible-server create \
  --resource-group "$RG" \
  --name "$PG_SERVER" \
  --location "$LOCATION" \
  --admin-user "$PG_USER" \
  --admin-password "$PG_PASS" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0 \
  -o none

az postgres flexible-server db create \
  --resource-group "$RG" \
  --server-name "$PG_SERVER" \
  --name "$PG_DB" \
  -o none

PG_HOST="${PG_SERVER}.postgres.database.azure.com"
echo "    Host: $PG_HOST"

# ── Build & Push images ───────────────────────────────────────────────────────
echo "==> Building backend image (runs in Azure)..."
az acr build \
  --registry "$ACR" \
  --image "ssp-backend:latest" \
  --file Dockerfile \
  . --no-logs -o none
echo "    ssp-backend:latest pushed"

echo "==> Building frontend image (runs in Azure)..."
az acr build \
  --registry "$ACR" \
  --image "ssp-frontend:latest" \
  --file Dockerfile.frontend.azure \
  . --no-logs -o none
echo "    ssp-frontend:latest pushed"

# ── Container Apps Environment ────────────────────────────────────────────────
echo "==> Creating Container Apps Environment..."
az containerapp env create \
  --name "$CA_ENV" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  -o none

# ── Backend Container App ─────────────────────────────────────────────────────
echo "==> Deploying backend..."
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
    DB_PASSWORD="$PG_PASS" \
    DB_NAME="$PG_DB" \
    JWT_SECRET="$JWT_SECRET" \
  -o none

BACKEND_FQDN=$(az containerapp show \
  --name "$BACKEND_APP" \
  --resource-group "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)

echo "    Backend: https://$BACKEND_FQDN"

# ── Frontend Container App ────────────────────────────────────────────────────
echo "==> Deploying frontend..."
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
  --name "$FRONTEND_APP" \
  --resource-group "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "============================================="
echo " DEPLOYMENT COMPLETE!"
echo "============================================="
echo " Frontend : https://$FRONTEND_FQDN"
echo " Backend  : https://$BACKEND_FQDN"
echo "============================================="
echo ""
echo "Saved deployment info to deploy/azure/.deployed.env"

cat > deploy/azure/.deployed.env <<EOF
FRONTEND_URL=https://$FRONTEND_FQDN
BACKEND_URL=https://$BACKEND_FQDN
RESOURCE_GROUP=$RG
ACR=$ACR_SERVER
PG_SERVER=$PG_SERVER
PG_USER=$PG_USER
EOF
