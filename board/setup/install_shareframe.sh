#!/bin/bash

set -e

echo "Starting shareframe installation..."

if [ -z "$2" ]; then
    echo "Usage: $0 <PUBLIC_SERIAL_NUMBER> <PRIVATE_SERIAL_NUMBER>"
    exit 1
fi

USER="frame"
PUBLIC_SERIAL_NUMBER=$1
SERIAL_NUMBER=$2
WORKING_DIR="/home/$USER/shareframe"

# services
APPLICATION_SERVICE_NAME="shareframe"
APPLICATION_SERVICE_FILE_NAME="$APPLICATION_SERVICE_NAME.service"

UPDATE_SERVICE_NAME="shareframe-update"
UPDATE_TIMER_FILE_NAME="$UPDATE_SERVICE_NAME.timer"

DASHBOARD_SERVICE_NAME="shareframe-dashboard"
DASHBOARD_SERVICE_FILE_NAME="$APPLICATION_SERVICE_NAME.service"

HEARTBEAT_SERVICE_NAME="shareframe-heartbeat"
HEARTBEAT_SERVICE_FILE_NAME="$APPLICATION_SERVICE_NAME.service"

# log files
APPLICATION_LOG_FILE="/var/log/shareframe/shareframe-application.log"
UPDATER_LOG_FILE="/var/log/shareframe/shareframe-update.log"
DASHBOARD_LOG_FILE="/var/log/shareframe/shareframe-dashboard.log"
HEARTBEAT_LOG_FILE="/var/log/shareframe/shareframe-heartbeat.log"

# setup log files
if [ ! -f "$APPLICATION_LOG_FILE" ]; then
    sudo touch "$APPLICATION_LOG_FILE"
    echo "Log file created: $APPLICATION_LOG_FILE"
fi
sudo chown "$USER:$USER" "$APPLICATION_LOG_FILE"
sudo chmod 664 "$APPLICATION_LOG_FILE"

if [ ! -f "$UPDATER_LOG_FILE" ]; then
    sudo touch "$UPDATER_LOG_FILE"
    echo "Log file created: $UPDATER_LOG_FILE"
fi
sudo chown "$USER:$USER" "$UPDATER_LOG_FILE"
sudo chmod 664 "$UPDATER_LOG_FILE"

if [ ! -f "$DASHBOARD_LOG_FILE" ]; then
    sudo touch "$DASHBOARD_LOG_FILE"
    echo "Log file created: $DASHBOARD_LOG_FILE"
fi
sudo chown "$USER:$USER" "$DASHBOARD_LOG_FILE"
sudo chmod 664 "$DASHBOARD_LOG_FILE"

if [ ! -f "$HEARTBEAT_LOG_FILE" ]; then
    sudo touch "$HEARTBEAT_LOG_FILE"
    echo "Log file created: $HEARTBEAT_LOG_FILE"
fi
sudo chown "$USER:$USER" "$HEARTBEAT_LOG_FILE"
sudo chmod 664 "$HEARTBEAT_LOG_FILE"

# Check if directories existing
if [ ! -d "$WORKING_DIR/app" ]; then
    echo "Error: Initial version folder app not found. Please copy initial version to board first."
    exit 1
fi

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

if [ ! -f "$WORKING_DIR/.env.serial-number" ]; then
    echo "SERIAL_NUMBER=" > "$WORKING_DIR/.env.serial-number"
fi

if grep -q "^SERIAL_NUMBER=" "$WORKING_DIR/.env.serial-number"; then
    sed -i "s/^SERIAL_NUMBER=.*/SERIAL_NUMBER='$SERIAL_NUMBER'/" "$WORKING_DIR/.env.serial-number"
else
    echo "SERIAL_NUMBER='$SERIAL_NUMBER'" >> "$WORKING_DIR/.env.serial-number"
fi

if grep -q "^PUBLIC_SERIAL_NUMBER=" "$WORKING_DIR/.env.serial-number"; then
    sed -i "s/^PUBLIC_SERIAL_NUMBER=.*/PUBLIC_SERIAL_NUMBER='$PUBLIC_SERIAL_NUMBER'/" "$WORKING_DIR/.env.serial-number"
else
    echo "PUBLIC_SERIAL_NUMBER='$PUBLIC_SERIAL_NUMBER'" >> "$WORKING_DIR/.env.serial-number"
fi
chown frame:frame "$WORKING_DIR/.env.serial-number"
chmod 644 "$WORKING_DIR/.env.serial-number"

apt-get update
apt-get upgrade -y
apt-get autoremove
apt-get install -y python3-pip python3-numpy libjpeg-dev zlib1g-dev python3-pil python3-gpiozero

cd $WORKING_DIR
python3 -m venv --system-site-packages .venv
source .venv/bin/activate
pip install --upgrade pip
pip install spidev gpiozero python-dotenv asyncio websockets==14.1 backoff requests gunicorn flask flask-cors requests netifaces

if [ -f "$WORKING_DIR/setup/$APPLICATION_SERVICE_FILE_NAME" ]; then
    cp $WORKING_DIR/setup/$APPLICATION_SERVICE_FILE_NAME /etc/systemd/system/$APPLICATION_SERVICE_FILE_NAME
else
    echo "Warning: $APPLICATION_SERVICE_FILE_NAME file not found!"
fi

if [ -f "$WORKING_DIR/setup/$UPDATE_SERVICE_NAME.timer" ] && [ -f "$WORKING_DIR/setup/$UPDATE_SERVICE_NAME.service" ]; then
    cp $WORKING_DIR/setup/$UPDATE_SERVICE_NAME.timer /etc/systemd/system/$UPDATE_SERVICE_NAME.timer
    cp $WORKING_DIR/setup/$UPDATE_SERVICE_NAME.service /etc/systemd/system/$UPDATE_SERVICE_NAME.service
else
    echo "Warning: $UPDATE_SERVICE_NAME-/ .service or .timer files not found!"
fi

if [ -f "$WORKING_DIR/setup/$DASHBOARD_SERVICE_FILE_NAME" ]; then
    cp $WORKING_DIR/setup/$DASHBOARD_SERVICE_FILE_NAME /etc/systemd/system/$DASHBOARD_SERVICE_FILE_NAME
else
    echo "Warning: $DASHBOARD_SERVICE_FILE_NAME file not found!"
fi

if [ -f "$WORKING_DIR/setup/$HEARTBEAT_SERVICE_FILE_NAME" ]; then
    cp $WORKING_DIR/setup/$HEARTBEAT_SERVICE_FILE_NAME /etc/systemd/system/$HEARTBEAT_SERVICE_FILE_NAME
else
    echo "Warning: $HEARTBEAT_SERVICE_FILE_NAME file not found!"
fi

systemctl daemon-reload

systemctl enable "$APPLICATION_SERVICE_FILE_NAME"
systemctl enable "$UPDATE_TIMER_FILE_NAME"
systemctl enable "$DASHBOARD_SERVICE_FILE_NAME"
systemctl enable "$HEARTBEAT_SERVICE_FILE_NAME"

echo "Installation complete!"