# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
# React build output is in /app/dist

# ── Stage 2: Production image (Express serves everything) ──────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Express server
COPY server ./server

# Copy React source (needed for quiz seeding import in db.js)
COPY src ./src

# Copy built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Express will serve the built React app as static files
EXPOSE 4000

CMD ["node", "server/index.js"]
