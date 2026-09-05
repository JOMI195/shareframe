#!/bin/bash
# Run the backend suite on the host against the shared test stack's database.
# Everything after the script name is passed straight to pytest.
#
# app-command.sh is bypassed on purpose: it edits the env file in place and
# restarts monitoring services this stack does not define.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

compose() {
  docker compose -p shareframe-test \
    -f "$REPO_ROOT/docker-compose.test.yml" \
    --env-file "$REPO_ROOT/.env.test" "$@"
}

echo "Starting the test database..."
compose up -d --wait backend_db

cd "$BACKEND_DIR"
exec uv run pytest "$@"
