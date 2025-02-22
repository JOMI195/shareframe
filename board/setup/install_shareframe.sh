#!/bin/bash

set -e

echo "Starting shareframe installation..."

if [ -z "$1" ]; then
    echo "Usage: $0 <SERIAL_NUMBER>"
    exit 1
fi

USER="frame"
SERIAL_NUMBER=$1
WORKING_DIR="/home/$USER/Documents/shareframe"

if [ ! -d "$WORKING_DIR/app" ]; then
    echo "Error: Initial version folder app not found. Please copy initial version to board first."
    exit 1
fi

# if [ ! -f "$WORKING_DIR/updater" ]; then
#     echo "Error: Updater folder not found. Please copy folder to board first."
#     exit 1
# fi

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

if [ ! -f "$WORKING_DIR/.env.serial-number" ]; then
    echo "SERIAL_NUMBER=" > "$WORKING_DIR/.env.serial-number"
fi

sed -i "s/^SERIAL_NUMBER=.*/SERIAL_NUMBER='$SERIAL_NUMBER'/" $WORKING_DIR/.env.serial-number
chmod 600 $WORKING_DIR/.env.serial-number

apt-get update
apt-get upgrade -y
apt-get install -y python3-pip python3-numpy libjpeg-dev zlib1g-dev python3-pil python3-gpiozero

cd $WORKING_DIR
python3 -m venv --system-site-packages .venv
source .venv/bin/activate
pip install spidev gpiozero python-dotenv asyncio websockets requests

if [ -f "$WORKING_DIR/setup/shareframe.service" ]; then
    cp $WORKING_DIR/setup/shareframe.service /etc/systemd/system/shareframe.service
else
    echo "Warning: shareframe.service file not found!"
fi

# if [ -f "$WORKING_DIR/setup/shareframe-updater.timer" ] && [ -f "$WORKING_DIR/setup/shareframe-updater.service" ]; then
#     cp $WORKING_DIR/setup/shareframe-updater.timer /etc/systemd/system/shareframe-updater.timer
#     cp $WORKING_DIR/setup/shareframe-updater.service /etc/systemd/system/shareframe-updater.service
# else
#     echo "Warning: shareframe-updater-/ .service or .timer files not found!"
# fi

echo "Installation complete!"
echo "Starting Application..."

systemctl daemon-reload

systemctl enable shareframe
systemctl start shareframe

# systemctl enable shareframe-updater.timer
# systemctl start shareframe-updater.timer

echo "Application started!"