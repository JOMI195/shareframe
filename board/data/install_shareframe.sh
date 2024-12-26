#!/bin/bash

set -e

echo "Starting shareframe installation..."

if [ -z "$1" ]; then
    echo "Usage: $0 <SERIAL_NUMBER>"
    exit 1
fi

USER="frame"
SERIAL_NUMBER=$1
INSTALL_DIR="/home/$USER/Documents/shareframe"

if [ ! -d "$INSTALL_DIR/data" ]; then
    echo "Error: data folder not found. Please copy board src first."
    exit 1
fi

if [ ! -f "$INSTALL_DIR/data/.env" ]; then
    echo "Error: .env file not found in data folder. Please copy board src first."
    exit 1
fi

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

apt-get update
apt-get upgrade -y
apt-get install -y python3-pip python3-numpy libjpeg-dev zlib1g-dev python3-pil python3-gpiozero

mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

python3 -m venv --system-site-packages .venv
source .venv/bin/activate

sed -i "s/^SERIAL_NUMBER=.*/SERIAL_NUMBER='$SERIAL_NUMBER'/" $INSTALL_DIR/data/.env
chmod 600 $INSTALL_DIR/data/.env

if [ -f "$INSTALL_DIR/data/requirements.txt" ]; then
    pip install -r $INSTALL_DIR/data/requirements.txt
else
    echo "Warning: requirements.txt not found in data folder!"
fi

if [ -f "$INSTALL_DIR/data/shareframe.service" ]; then
    cp $INSTALL_DIR/data/shareframe.service /etc/systemd/system/shareframe.service
    systemctl daemon-reload
    systemctl enable shareframe
    systemctl start shareframe
else
    echo "Warning: shareframe.service file not found!"
fi

echo "Installation complete!"