#!/bin/bash

# Set up logging
LOG_DIR="/var/log/network-monitor"
LOG_FILE="${LOG_DIR}/network.log"
COUNTER_FILE="${LOG_DIR}/down_counter"

# Configuration
WLAN='wlan0'
PING_IP='google.com'
MAX_FAILURES=144 # Number of consecutive failures before reboot (144=24h downtime)
NOW=$(date +"%Y-%m-%d %r")

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run as root"
    exit 1
fi

# Create log directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    install -d -m 755 "$LOG_DIR"
fi

# Ensure log file exists with proper permissions
touch "$LOG_FILE" 2>/dev/null
chmod 640 "$LOG_FILE"

# Log rotation function
rotate_logs() {
    local max_size=$((5 * 1024 * 1024)) # 5MB
    local file_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE")
    if [ "$file_size" -gt "$max_size" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        touch "$LOG_FILE"
        chmod 640 "$LOG_FILE"
    fi
}

# Perform log rotation
rotate_logs

# Initialize or read failure counter
if [ ! -f "$COUNTER_FILE" ]; then
    echo "0" > "$COUNTER_FILE"
fi
FAILURES=$(cat "$COUNTER_FILE")

# Network check and reset if necessary
if ! /bin/ping -c 2 -I "$WLAN" "$PING_IP" > /dev/null 2>&1; then
    echo "$NOW Network is DOWN. Performing reset" >> "$LOG_FILE"
    
    # Use systemctl to restart NetworkManager instead of ifdown/ifup
    systemctl restart NetworkManager
    sleep 5

    # Increment failure counter
    FAILURES=$((FAILURES + 1))
    echo "$NOW Consecutive failures: $FAILURES" >> "$LOG_FILE"
    echo "$FAILURES" > "$COUNTER_FILE"

    # Check if max failures reached
    if [ "$FAILURES" -ge "$MAX_FAILURES" ]; then
        echo "$NOW Maximum failures ($MAX_FAILURES) reached. Initiating system reboot..." >> "$LOG_FILE"
        # Reset counter before reboot
        echo "0" > "$COUNTER_FILE"
        # Sync filesystem to disk
        sync
        # Reboot system
        /sbin/reboot
    fi
else
    echo "$NOW Network is UP. Normal operation." >> "$LOG_FILE"
    # Reset failure counter
    echo "0" > "$COUNTER_FILE"
fi