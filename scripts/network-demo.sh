#!/bin/bash
# Shows how the six containers talk to each other over Docker networks.
# Run from the repo root (containers must be up: docker compose up -d --wait):
#   bash scripts/network-demo.sh
cd "$(dirname "$0")/.."

step() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
ok()   { printf '\033[32m   OK: %s\033[0m\n' "$1"; }
no()   { printf '\033[31m   BLOCKED: %s\033[0m\n' "$1"; }
node_tcp() { # node_tcp <service> <host> <port>
  docker compose exec -T "$1" node -e \
    "require('net').connect($3,'$2',()=>{console.log('   $1 connected to $2:$3');process.exit()}).on('error',e=>{console.log('   '+e.code);process.exit(1)})"
}

step "1. The six containers"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

step "2. The two networks Docker created from docker-compose.yml"
docker network ls --filter name=ssp --format "table {{.Name}}\t{{.Driver}}\t{{.Internal}}"

step "3. Who is on which network (each container gets its own private IP)"
for n in ssp-frontend-net ssp-backend-net; do
  docker network inspect "$n" --format \
    '{{.Name}}  subnet {{range .IPAM.Config}}{{.Subnet}}{{end}}{{range .Containers}}
     {{.Name}}  {{.IPv4Address}}{{end}}'
done

step "4. Every service answers its own health check"
for s in auth-service task-service quiz-service progress-service; do
  docker compose exec -T frontend wget -qO- "http://$s:4000/health" && echo
done

step "5. Gateway routing: each path reaches the service that owns it"
for path in login tasks/x quizzes progress/x; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X GET "http://localhost:${FRONTEND_PORT:-3000}/api/$path")
  printf '   /api/%-11s -> HTTP %s (401/404 from the service = routed)\n' "$path" "$code"
done

step "6. Database per service: auth, task and quiz reach the db"
node_tcp task-service db 5432 && ok "task-service reached db:5432"

step "7. progress-service -> db (not on backend-net)"
if node_tcp progress-service db 5432 >/dev/null 2>&1; then
  ok "progress-service reached db (unexpected)"
else
  no "progress-service cannot reach the database: it only talks to task and quiz"
fi

step "8. frontend -> db (not on the same network)"
if docker compose exec -T frontend nc -z -w 3 db 5432 2>/dev/null; then
  ok "frontend reached db (unexpected)"
else
  no "frontend cannot even resolve \"db\": it is not on ssp-backend-net"
fi

step "9. db -> internet (backend-net is internal)"
if docker compose exec -T db wget -q -T 5 -O /dev/null http://example.com 2>/dev/null; then
  ok "db reached the internet (unexpected)"
else
  no "db has no route to the internet"
fi

step "10. Your laptop -> containers (only the gateway publishes a port)"
printf '   frontend: %s\n' "$(docker compose port frontend 80)"
for c in ssp-auth ssp-task ssp-quiz ssp-progress ssp-db; do
  [ -z "$(docker port "$c")" ] && no "$c publishes no port"
done
echo
