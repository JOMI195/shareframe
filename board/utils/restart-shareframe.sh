#!/bin/bash

# Set up logging
LOG_DIR="/var/log/shareframe"
LOG_FILE="${LOG_DIR}/restart-shareframe.log"

# Create log directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    chmod 755 "$LOG_DIR"
fi

# Ensure log file exists
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Get current timestamp
NOW=$(date +"%Y-%m-%d %r")

# Restart the service
echo "$NOW Restarting shareframe service..." >> "$LOG_FILE"
sudo systemctl restart shareframe
STATUS=$?

if [ $STATUS -eq 0 ]; then
    echo "$NOW Service restart successful" >> "$LOG_FILE"
else
    echo "$NOW Service restart failed with status $STATUS" >> "$LOG_FILE"
fi