#!/bin/bash
# Shows how the three containers talk to each other over Docker networks.
# Run from the repo root (containers must be up: docker compose up -d):
#   bash scripts/network-demo.sh
cd "$(dirname "$0")/.."

step() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
ok()   { printf '\033[32m   OK: %s\033[0m\n' "$1"; }
no()   { printf '\033[31m   BLOCKED: %s\033[0m\n' "$1"; }

step "1. The three containers"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

step "2. The two networks Docker created from docker-compose.yml"
docker network ls --filter name=ssp --format "table {{.Name}}\t{{.Driver}}\t{{.Internal}}"

step "3. Who is on which network (each container gets its own private IP)"
for n in ssp-frontend-net ssp-backend-net; do
  docker network inspect "$n" --format \
    '{{.Name}}  subnet {{range .IPAM.Config}}{{.Subnet}}{{end}}{{range .Containers}}
     {{.Name}}  {{.IPv4Address}}{{end}}'
done

step "4. Docker DNS: containers find each other by service name"
docker compose exec -T frontend nslookup backend 2>/dev/null | grep -A1 "Name:" | tail -1 | sed 's/^/   frontend resolves "backend" -> /'
docker compose exec -T backend node -e \
  "require('dns').lookup('db',(e,a)=>console.log('   backend resolves \"db\" -> '+(e?e.code:a)))"

step "5. frontend -> backend (frontend-net, HTTP port 4000)"
docker compose exec -T frontend wget -qO- http://backend:4000/api/health && echo && ok "frontend reached backend:4000"

step "6. backend -> db (backend-net, PostgreSQL port 5432)"
docker compose exec -T backend node -e \
  "require('net').connect(5432,'db',()=>{console.log('   connected to db:5432');process.exit()}).on('error',e=>{console.log('   '+e.code);process.exit(1)})" \
  && ok "backend reached db:5432"

step "7. frontend -> db (not on the same network)"
if docker compose exec -T frontend nc -z -w 3 db 5432 2>/dev/null; then
  ok "frontend reached db (unexpected)"
else
  no "frontend cannot even resolve \"db\": it is not on ssp-backend-net"
fi

step "8. db -> internet (backend-net is internal)"
if docker compose exec -T db wget -q -T 5 -O /dev/null http://example.com 2>/dev/null; then
  ok "db reached the internet (unexpected)"
else
  no "db has no route to the internet"
fi

step "9. Your laptop -> containers (only published ports are reachable)"
printf '   frontend: %s\n' "$(docker compose port frontend 80)"
printf '   backend : %s\n' "$(docker compose port backend 4000)"
if [ -z "$(docker port ssp-db)" ]; then no "db publishes no port"; fi

step "10. Full path: browser -> localhost:3000 -> nginx -> backend -> db"
curl -s http://localhost:3000/api/health && echo && ok "request went through all three containers"
echo
