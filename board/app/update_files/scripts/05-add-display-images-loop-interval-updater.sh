#!/bin/bash

# 03-add-display-images-loop-interval-updater.sh
# Script to install the display images loop interval update utility

echo "=== SHAREFRAME INTERVAL UPDATER SETUP ==="
echo "Starting setup at $(date)"
echo "Running as user: $(whoami)"

# Check if running as sudo/root (needed for some operations)
if [ "$EUID" -ne 0 ]; then
    echo "⚠️ WARNING: This script should be run with sudo privileges"
    echo "Please run again with: sudo $0"
    exit 1
fi

# Define paths
BASE_DIR="/home/frame/shareframe"
SCRIPT_PATH="$BASE_DIR/app/display/update_display_images_loop_interval.sh"
DISPLAY_IMAGES_LOOP_INTERVAL_DIR="$BASE_DIR/.settings"
DISPLAY_IMAGES_LOOP_INTERVAL_FILE="$DISPLAY_IMAGES_LOOP_INTERVAL_DIR/display_images_loop_interval.json"

# Create directories if they don't exist
echo "Creating necessary directories..."
mkdir -p "$DISPLAY_IMAGES_LOOP_INTERVAL_DIR"

# Make the script executable
chmod +x "$SCRIPT_PATH"

# Create a default control file with 15min interval if it doesn't exist
if [ ! -f "$DISPLAY_IMAGES_LOOP_INTERVAL_FILE" ]; then
  echo "Creating default control file at $DISPLAY_IMAGES_LOOP_INTERVAL_FILE"
  echo '{"interval_secs": 900}' > "$DISPLAY_IMAGES_LOOP_INTERVAL_FILE"
fi

# Set proper ownership
echo "Setting correct ownership for files and directories..."
chown -R frame:frame "$DISPLAY_IMAGES_LOOP_INTERVAL_DIR"

# Configure sudoers for SIGUSR2 signal
echo "Configuring sudoers for SIGUSR2 signal access..."
SIGUSR2_LINE="frame ALL=(ALL) NOPASSWD: /bin/systemctl kill -s SIGUSR2 shareframe"
SUDOERS_D_FILE="/etc/sudoers.d/shareframe_nopasswd"

# Check if sudoers file exists and contains the required line
if [ -f "$SUDOERS_D_FILE" ] && grep -Fxq "$SIGUSR2_LINE" "$SUDOERS_D_FILE"; then
    echo "✅ Sudoers entry already exists and is configured correctly"
elif [ -f "$SUDOERS_D_FILE" ]; then
    echo "Sudoers file exists but missing required line, appending..."
    
    # Append the line to the existing file on a new line
    echo "" >> "$SUDOERS_D_FILE"
    echo "$SIGUSR2_LINE" >> "$SUDOERS_D_FILE"
    
    # Validate the updated sudoers file
    if visudo -cf "$SUDOERS_D_FILE"; then
        echo "✅ Sudoers entry appended successfully to $SUDOERS_D_FILE"
    else
        echo "❌ ERROR: Sudoers file validation failed after appending"
        # Restore the file by removing the last line we added
        sed -i '$d' "$SUDOERS_D_FILE"
        exit 1
    fi
else
    echo "Creating new sudoers configuration file..."
    
    # Create the sudoers file
    echo "$SIGUSR2_LINE" > "$SUDOERS_D_FILE"
    chmod 440 "$SUDOERS_D_FILE"

    # Validate the sudoers file
    if visudo -cf "$SUDOERS_D_FILE"; then
        echo "✅ Sudoers file created successfully at $SUDOERS_D_FILE"
    else
        echo "❌ ERROR: Sudoers file validation failed, removing file"
        rm -f "$SUDOERS_D_FILE"
        exit 1
    fi
fi

echo
echo "✅ Setup completed successfully!"
echo
echo "Setup completed at $(date)"
exit 0