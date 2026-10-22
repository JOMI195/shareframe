#!/bin/bash

# Check for at least 3 arguments
if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <docker-compose-file> <env-file> <docker-compose-command> [<container-name>]"
  exit 1
fi

DOCKER_COMPOSE_FILE="$1"
ENV_FILE="$2"
DOCKER_COMPOSE_COMMAND="$3"
CONTAINER_NAME="${4:-all}"  # Default to 'all' if not provided

# Backend, websockets and the workers share one image and must never run different code.
if [ "$CONTAINER_NAME" == "backend-stack" ]; then
  SERVICES="backend websockets celery celery-beat"
else
  SERVICES="$CONTAINER_NAME"
fi

# Check if the Docker Compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
  echo "Error: Docker Compose file '$DOCKER_COMPOSE_FILE' not found!"
  exit 1
fi

# Check if the environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file '$ENV_FILE' not found!"
  exit 1
fi

# Docker would create the bind-mounted switch dir as root otherwise.
mkdir -p "$(dirname "$DOCKER_COMPOSE_FILE")/data/maintenance"

# Generate the build version
if GIT_SHA=$(git rev-parse --short=8 HEAD 2>/dev/null); then
  BUILD_DATE=$(git log -1 --format=%cd --date=format:%Y-%m-%d)
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    # Each uncommitted state gets its own version, else two different dirty builds look identical.
    DIRTY_HASH=$( { git diff HEAD; git ls-files --others --exclude-standard | while read -r f; do echo "$f"; git hash-object -- "$f"; done; } | sha1sum | cut -c1-6)
    GIT_SHA="${GIT_SHA}-dirty-${DIRTY_HASH}"
  fi
  BUILD_VERSION="${BUILD_DATE}-${GIT_SHA}"
else
  BUILD_DATE=$(date -u +"%Y-%m-%d")
  if command -v uuidgen > /dev/null; then
    # Linux/macOS
    BUILD_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]' | awk -F'-' '{print substr($1,1,8)}')
  else
    # Windows
    BUILD_UUID=$(powershell -Command "[guid]::NewGuid().ToString().Substring(0,8)" | tr '[:upper:]' '[:lower:]')
  fi
  BUILD_VERSION="${BUILD_DATE}-${BUILD_UUID}"
fi

# Export the build versions into the environment
export APP_BUILD_VERSION="$BUILD_VERSION"
export VITE_APP_BUILD_VERSION="$BUILD_VERSION"

# Create a backup of the original env file
cp "$ENV_FILE" "${ENV_FILE}.backup"

# Append build version variables to the existing env file
echo "" >> "$ENV_FILE"  # Add a newline for clarity
echo "# Build version variables generated on $(date)" >> "$ENV_FILE"
echo "APP_BUILD_VERSION=$BUILD_VERSION" >> "$ENV_FILE"
echo "VITE_APP_BUILD_VERSION=$BUILD_VERSION" >> "$ENV_FILE"

echo "Added build version variables to env file"

# Run the Docker Compose command
if [ "$CONTAINER_NAME" == "all" ]; then
  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" $DOCKER_COMPOSE_COMMAND
else
  for SERVICE in $SERVICES; do
    if ! grep -q "^\s*$SERVICE:" "$DOCKER_COMPOSE_FILE" && ! grep -q "^\s*services:.*$SERVICE:" "$DOCKER_COMPOSE_FILE"; then
      echo "Warning: Container '$SERVICE' not explicitly found in the Docker Compose file."
      echo "Proceeding anyway as it might be a valid service name or command parameter..."
    fi
  done

  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" $DOCKER_COMPOSE_COMMAND $SERVICES
fi

RESULT=$?

# Editing a bind-mounted config never recreates its container, so reload them here.
if [ $RESULT -eq 0 ] && [ "$CONTAINER_NAME" == "all" ] && [[ "$DOCKER_COMPOSE_COMMAND" == up* ]]; then
  # a running Grafana alerts while Prometheus restarts
  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" stop grafana
  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" \
    restart prometheus promtail loki telegraf
  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d --wait grafana
  if docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" config --services | grep -qx nginx \
    && docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T nginx nginx -t; then
    docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T nginx nginx -s reload
  fi
fi

# Restore the original env file
mv "${ENV_FILE}.backup" "$ENV_FILE"
echo "Restored original env file"

echo "Docker Compose operation completed with exit code: $RESULT"
exit $RESULT