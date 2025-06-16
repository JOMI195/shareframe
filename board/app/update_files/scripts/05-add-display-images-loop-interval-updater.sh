#!/bin/bash

# 03-add-display-images-loop-interval-updater.sh
# Script to install the display images loop interval update utility

# Check if running as sudo/root (needed for some operations)
if [ "$EUID" -ne 0 ]; then
    exit 1
fi

# Define paths
BASE_DIR="/home/frame/shareframe"
SCRIPT_PATH="$BASE_DIR/app/display/update_display_images_loop_interval.sh"
DISPLAY_IMAGES_LOOP_INTERVAL_DIR="$BASE_DIR/.settings"
DISPLAY_IMAGES_LOOP_INTERVAL_FILE="$DISPLAY_IMAGES_LOOP_INTERVAL_DIR/display_images_loop_interval.json"

# Create directories if they don't exist
if [ ! -d "$DISPLAY_IMAGES_LOOP_INTERVAL_DIR" ]; then
    mkdir -p "$DISPLAY_IMAGES_LOOP_INTERVAL_DIR"
    chown -R frame:frame "$DISPLAY_IMAGES_LOOP_INTERVAL_DIR"
fi

# Make the script executable
if [ -f "$SCRIPT_PATH" ]; then
    if [ ! -x "$SCRIPT_PATH" ]; then
        chmod +x "$SCRIPT_PATH"
    fi
fi

# Create a default control file with 15min interval if it doesn't exist
if [ ! -f "$DISPLAY_IMAGES_LOOP_INTERVAL_FILE" ]; then
    echo '{"interval_secs": 900}' > "$DISPLAY_IMAGES_LOOP_INTERVAL_FILE"
fi

# Configure sudoers for SIGUSR2 signal
SIGUSR2_LINE="frame ALL=(ALL) NOPASSWD: /bin/systemctl kill -s SIGUSR2 shareframe"
SUDOERS_D_FILE="/etc/sudoers.d/shareframe_nopasswd"

# Check if sudoers file exists and contains the required line
if [ -f "$SUDOERS_D_FILE" ] && grep -Fxq "$SIGUSR2_LINE" "$SUDOERS_D_FILE"; then
    exit 0
elif [ -f "$SUDOERS_D_FILE" ]; then
    # Append the line to the existing file on a new line
    echo "" >> "$SUDOERS_D_FILE"
    echo "$SIGUSR2_LINE" >> "$SUDOERS_D_FILE"
    
    # Validate the updated sudoers file
    if visudo -cf "$SUDOERS_D_FILE"; then
        exit 0
    else
        # Restore the file by removing the last line we added
        sed -i '$d' "$SUDOERS_D_FILE"
        exit 1
    fi
else
    # Create the sudoers file
    echo "$SIGUSR2_LINE" > "$SUDOERS_D_FILE"
    chmod 440 "$SUDOERS_D_FILE"

    # Validate the sudoers file
    if visudo -cf "$SUDOERS_D_FILE"; then
        exit 0
    else
        rm -f "$SUDOERS_D_FILE"
        exit 1
    fi
fi