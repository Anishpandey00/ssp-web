# Express API container. The React frontend has its own Dockerfile.frontend.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY server ./server

USER node
EXPOSE 4000

CMD ["node", "server/index.js"]
