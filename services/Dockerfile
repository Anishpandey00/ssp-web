# One image per service: build with --build-arg SERVICE=auth-service (or
# task-service, quiz-service, progress-service). Each image holds the shared
# code plus only its own service folder.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

ARG SERVICE
RUN test -n "$SERVICE" || (echo "Build with --build-arg SERVICE=<name>-service" && exit 1)
ENV SERVICE=${SERVICE}
COPY shared ./shared
COPY ${SERVICE} ./${SERVICE}

USER node
EXPOSE 4000
ENV PORT=4000

CMD ["sh", "-c", "exec node \"$SERVICE/index.js\""]
