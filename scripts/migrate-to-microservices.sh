#!/bin/bash
# One-time copy of existing data from the old single database
# (smart_study_planner) into the three service databases:
#   users                       -> auth_db
#   tasks                       -> task_db
#   quizzes, questions, scores  -> quiz_db
#
# Run from the repo root after `docker compose up -d --wait`, so every service
# has created its tables:
#   bash scripts/migrate-to-microservices.sh --yes
#
# The target tables are emptied first (a fresh install only holds the starter
# quizzes and, if configured, the seeded admin). The old database is only read.
set -euo pipefail
cd "$(dirname "$0")/.."

LEGACY_DB="${LEGACY_DB:-smart_study_planner}"

if [ "${1:-}" != "--yes" ]; then
  echo "This replaces the data in auth_db, task_db and quiz_db with the data in $LEGACY_DB."
  echo "Run again with --yes to continue."
  exit 1
fi

# psql inside the db container: psql_db <database> [psql options...]
psql_db() {
  local database=$1; shift
  docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" "$@"' sh -d "$database" "$@"
}

if [ "$(psql_db postgres -tA -c "SELECT 1 FROM pg_database WHERE datname = '$LEGACY_DB'")" != "1" ]; then
  echo "No database named $LEGACY_DB: nothing to migrate."
  exit 0
fi

copy_tables() { # copy_tables <target_db> <table>...
  local target=$1; shift
  {
    echo "BEGIN;"
    echo "TRUNCATE $(IFS=,; echo "$*") CASCADE;"
    for table in "$@"; do
      # Copy the columns the new table has, in its own order.
      cols=$(psql_db "$target" -tA -c "SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$table'")
      echo "COPY $table ($cols) FROM STDIN;"
      psql_db "$LEGACY_DB" -c "COPY (SELECT $cols FROM $table) TO STDOUT"
      echo '\.'
    done
    echo "COMMIT;"
  } | psql_db "$target"
  for table in "$@"; do
    printf '   %-10s -> %-8s %s rows\n' "$table" "$target" "$(psql_db "$target" -tA -c "SELECT COUNT(*) FROM $table")"
  done
}

echo "Copying $LEGACY_DB into the service databases:"
copy_tables auth_db users
copy_tables task_db tasks
copy_tables quiz_db quizzes questions scores
echo "Done. $LEGACY_DB was left unchanged; drop it yourself once you have checked the app."
