#!/bin/bash

# 01-sudo-test.sh - Test script that requires sudo privileges
# This script demonstrates operations that need root access

echo "=== SUDO TEST SCRIPT ==="
echo "Starting sudo test script execution at $(date)"
echo "Running as user: $(whoami)"

# This should show root if the script is running with sudo
if [ "$EUID" -eq 0 ]; then
    echo "✅ Running with root privileges as expected"
else
    echo "❌ ERROR: Not running with root privileges! This script requires sudo."
    exit 1
fi

# Create a system log entry (requires root)
echo "Shareframe update sudo test executed on $(date)" >> /var/log/sudo-test.log
echo "✅ Created system log entry at /var/log/sudo-test.log"

# Create a file in a root-owned directory
TEST_FILE="/var/tmp/shareframe-sudo-test-$(date +%Y%m%d_%H%M%S).txt"
echo "This file was created by the sudo test script at $(date)" > "$TEST_FILE"
echo "✅ Created test file at: $TEST_FILE"

# Check system services (something typical for a sudo script)
echo "System service status:"
systemctl status systemd-timesyncd.service | head -3

# Create and set permissions on a directory
TEST_DIR="/var/tmp/shareframe-test-dir"
mkdir -p "$TEST_DIR"
chmod 755 "$TEST_DIR"
echo "✅ Created and set permissions on test directory: $TEST_DIR"

echo "Sudo test script completed successfully"
exit 0