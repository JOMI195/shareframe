#!/bin/bash

# 02-regular-test.sh - Test script that runs without sudo
# This script demonstrates operations that don't need root access

echo "=== REGULAR TEST SCRIPT ==="
echo "Starting regular test script execution at $(date)"
echo "Running as user: $(whoami)"

# This should show the normal user
if [ "$EUID" -eq 0 ]; then
    echo "⚠️ WARNING: Running with root privileges, but this script doesn't need sudo"
else
    echo "✅ Running with normal user privileges as expected"
fi

# Display system information
echo "System information:"
echo "Hostname: $(hostname)"
echo "Kernel version: $(uname -r)"
echo "Memory info: $(free -h | head -2)"

# Create a test file in user-accessible location
TEST_FILE="/tmp/shareframe-regular-test-$(date +%Y%m%d_%H%M%S).txt"
echo "This file was created by the regular test script at $(date)" > "$TEST_FILE"
echo "✅ Created test file at: $TEST_FILE"

# Test network connectivity
echo "Testing network connectivity:"
if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ Network is connected"
else
    echo "⚠️ WARNING: Network connectivity issue detected"
fi

# Read environment variable
echo "Application version: ${VERSION:-unknown}"

# Create a JSON sample
echo "Creating sample JSON data..."
JSON_FILE="/tmp/shareframe-sample-data.json"
cat > "$JSON_FILE" << EOL
{
  "name": "Shareframe",
  "test_execution": "success",
  "timestamp": "$(date -Iseconds)",
  "user": "$(whoami)"
}
EOL
echo "✅ Created sample JSON at: $JSON_FILE"

echo "Regular test script completed successfully"
exit 0