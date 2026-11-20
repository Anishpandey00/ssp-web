# Testing

## Automated unit tests

Run with `npm test` (Node's built-in `node:test`, no extra framework).

| File | Covers |
|---|---|
| `tests/admin-seed.test.js` | No default admin; existing admins preserved; short passwords rejected; bcrypt hash and parameterised insert |
| `tests/due-date.test.js` | Due-date rule on client and server: valid range, malformed and out-of-range dates, month-end edge cases |
| `tests/tasks.test.js` | Due labels, task sorting, task form validation |
| `tests/progress.test.js` | Combining task and quiz numbers; Quiz-service outage |
| `tests/study-plan.test.js` | Goal validation, date handling, prompt calendar, cleaning model output, rate limiter |
| `tests/study-tips.test.js` | Facts worked out in code, prompt contents, rule tips, cleaning answers, cache |

## Continuous integration

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs on every push
to `main` and every pull request:

1. Install frontend dependencies (`npm ci`)
2. Unit tests (`npm test`)
3. Production build (`npm run build`)
4. Install service dependencies and syntax-check every service file
5. Validate `docker-compose.yml`

## Manual and integration tests

Manual functional tests (TC-01 to TC-35), with steps, expected results and
results, are in the [RTM and RACI workbook](../reports/SSP_RTM_RACI_Team_D_fixed.xlsx).

Useful checks against the running stack:

```bash
# Gateway and service health
curl http://localhost:3000/api/health
docker compose ps

# Fault tolerance: stop the Quiz service and confirm tasks and progress still work
docker compose stop quiz-service
docker compose start quiz-service

# Network segmentation
bash scripts/network-demo.sh
```

Passing the automated checks does not replace checking the running containers
and the main user flows before a release.
