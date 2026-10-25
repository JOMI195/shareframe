#!/bin/sh
set -euo pipefail

usage() {
  echo "usage: restore.sh db [snapshot]" >&2
  echo "       restore.sh files [snapshot] [target]" >&2
  exit 1
}

snapshot=${2:-latest}

case "${1:-}" in
  db)
    # DROP DATABASE fails while the app is still connected
    active=$(psql -d postgres -tAc \
      "SELECT count(*) FROM pg_stat_activity WHERE datname IS NOT NULL AND pid <> pg_backend_pid()")
    if [ "$active" -gt 0 ]; then
      echo "$active open database connections, stop the backend stack first" >&2
      exit 1
    fi
    restic dump --tag postgres "$snapshot" /postgres.sql | psql -q -d postgres
    ;;
  files)
    restic restore "$snapshot" --tag files --target "${3:-/restore}"
    ;;
  *)
    usage
    ;;
esac
