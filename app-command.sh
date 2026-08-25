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
if command -v uuidgen > /dev/null; then
  # Linux/macOS
  BUILD_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]' | awk -F'-' '{print substr($1,1,8)}')
else
  # Windows
  BUILD_UUID=$(powershell -Command "[guid]::NewGuid().ToString().Substring(0,8)" | tr '[:upper:]' '[:lower:]')
fi
BUILD_VERSION="${BUILD_DATE}-${BUILD_UUID}"

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
  # Check if the specified container exists in the configuration
  if ! grep -q "^\s*$CONTAINER_NAME:" "$DOCKER_COMPOSE_FILE" && ! grep -q "^\s*services:.*$CONTAINER_NAME:" "$DOCKER_COMPOSE_FILE"; then
    echo "Warning: Container '$CONTAINER_NAME' not explicitly found in the Docker Compose file."
    echo "Proceeding anyway as it might be a valid service name or command parameter..."
  fi

  # Run the command on the specified container
  docker compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" $DOCKER_COMPOSE_COMMAND "$CONTAINER_NAME"
fi

RESULT=$?

# Restore the original env file
mv "${ENV_FILE}.backup" "$ENV_FILE"
echo "Restored original env file"

echo "Docker Compose operation completed with exit code: $RESULT"
exit $RESULT