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

# Generate the build version
BUILD_DATE=$(date -u +"%Y-%m-%d")
BUILD_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]' | awk -F'-' '{print substr($1,1,8)}')
BUILD_VERSION="${BUILD_DATE}-${BUILD_UUID}"

export VITE_APP_BUILD_VERSION=$BUILD_VERSION

# Run the Docker Compose command
if [ "$CONTAINER_NAME" == "all" ]; then
  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" $DOCKER_COMPOSE_COMMAND
else
  # Check if the specified container exists
  if ! docker compose -f "$DOCKER_COMPOSE_FILE" ps -q "$CONTAINER_NAME" > /dev/null; then
    echo "Error: Container '$CONTAINER_NAME' not found in the Docker Compose file!"
    exit 1
  fi

  # Run the command on the specified container
  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" $DOCKER_COMPOSE_COMMAND "$CONTAINER_NAME"
fi
