#!/bin/bash

# Script to update display interval for shareframe application
# Usage: ./update_display_images_loop_interval.sh [interval_in_seconds]

# Default settings path
CONTROL_FILE="/home/frame/shareframe/.settings/display_images_loop_interval.json"

# Check if argument is provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 [interval_in_seconds]"
  echo "Example: $0 900  # Sets interval to 15 minutes"
  exit 1
fi

# Validate input is a positive number
if ! [[ "$1" =~ ^[0-9]+$ ]] || [ "$1" -eq 0 ]; then
  echo "Error: Interval must be a positive number in seconds"
  exit 1
fi

NEW_INTERVAL=$1

# Create or update the control file
echo "{\"interval_secs\": $NEW_INTERVAL}" > "$CONTROL_FILE"

# Send SIGUSR2 signal to trigger interval check and update
PID=$(systemctl show -p MainPID --value shareframe.service)

if [ -z "$PID" ] || [ "$PID" -eq 0 ]; then
  echo "Error: shareframe service is not running"
  exit 1
fi

# Send the signal to the process
kill -SIGUSR2 $PID

echo "Display images loop interval updated to $NEW_INTERVAL seconds"
echo "Signal sent to PID $PID to reload settings"