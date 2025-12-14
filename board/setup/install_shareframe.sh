#!/bin/bash

set -e

echo "Starting shareframe installation..."

if [ -z "$4" ]; then
    echo "Usage: $0 <FRAME_AUTH_SECRET_KEY> <UPDATE_HASH_SECRET_KEY> <PUBLIC_SERIAL_NUMBER> <PRIVATE_SERIAL_NUMBER>"
    exit 1
fi

USER="frame"
FRAME_AUTH_SECRET_KEY=$1
UPDATE_HASH_SECRET_KEY=$2
PUBLIC_SERIAL_NUMBER=$3
SERIAL_NUMBER=$4

USER_DIR="/home/$USER"
WORKING_DIR="$USER_DIR/shareframe"
APPLICATION_DIR="$WORKING_DIR/app"

# services
APPLICATION_SERVICE_NAME="shareframe"
APPLICATION_SERVICE_FILE_NAME="$APPLICATION_SERVICE_NAME.service"

UPDATE_ALL_SERVICE_NAME="shareframe-update-all"
UPDATE_SERVICE_NAME="shareframe-update"
UPDATE_TIMER_FILE_NAME="$UPDATE_SERVICE_NAME.timer"

DASHBOARD_SERVICE_NAME="shareframe-dashboard"
DASHBOARD_SERVICE_FILE_NAME="$DASHBOARD_SERVICE_NAME.service"

HEARTBEAT_SERVICE_NAME="shareframe-heartbeat"
HEARTBEAT_SERVICE_FILE_NAME="$HEARTBEAT_SERVICE_NAME.service"

# log files
APPLICATION_LOG_FILE="/var/log/shareframe/shareframe-application.log"
UPDATER_LOG_FILE="/var/log/shareframe/shareframe-update.log"
DASHBOARD_LOG_FILE="/var/log/shareframe/shareframe-dashboard.log"
HEARTBEAT_LOG_FILE="/var/log/shareframe/shareframe-heartbeat.log"

# Check if directories existing
if [ ! -d "$WORKING_DIR/app" ]; then
    echo "Error: Initial version folder app not found. Please copy initial version to board first."
    exit 1
fi

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# setup log files
echo "Creating log files"
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
echo "Creating log files done"

# secrets file
echo "Creating secrets file"
if [ ! -f "$WORKING_DIR/.env.secrets" ]; then
    echo "SERIAL_NUMBER=" > "$WORKING_DIR/.env.secrets"
fi

update_or_add_secret() {
    local key=$1
    local value=$2
    local file=$3
    
    if grep -q "^${key}=" "$file"; then
        sed -i "s|^${key}=.*|${key}='${value}'|" "$file"
    else
        echo "${key}='${value}'" >> "$file"
    fi
}

update_or_add_secret "SERIAL_NUMBER" "$SERIAL_NUMBER" "$WORKING_DIR/.env.secrets"
update_or_add_secret "PUBLIC_SERIAL_NUMBER" "$PUBLIC_SERIAL_NUMBER" "$WORKING_DIR/.env.secrets"
# TODO: this wont work when reusing
update_or_add_secret "FRAME_AUTH_SECRET_KEY" "$FRAME_AUTH_SECRET_KEY" "$WORKING_DIR/.env.secrets"
update_or_add_secret "UPDATE_HASH_SECRET_KEY" "$UPDATE_HASH_SECRET_KEY" "$WORKING_DIR/.env.secrets"

chown frame:frame "$WORKING_DIR/.env.secrets"
chmod 644 "$WORKING_DIR/.env.secrets"
echo "Creating secrets file done"

# dependencies
echo "Installing and update pi dependencies"
apt-get update
apt-get upgrade -y
apt-get autoremove
apt-get install -y nginx python3-pip python3-numpy libjpeg-dev zlib1g-dev python3-pil python3-gpiozero libssl-dev pkg-config libffi-dev gcc musl-dev
echo "Installing and update pi dependencies done"

# nginx conf for dashboard
echo "Configuring nginx for dashboard"
# Safely remove default config if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm "/etc/nginx/sites-enabled/default"
fi
cp "$APPLICATION_DIR/dashboard/nginx/shareframe-dashboard.conf" /etc/nginx/sites-available/shareframe-dashboard
cp "$APPLICATION_DIR/dashboard/nginx/502-error.html" /usr/share/nginx/html/
rm -f /etc/nginx/sites-enabled/shareframe-dashboard
ln -s /etc/nginx/sites-available/shareframe-dashboard /etc/nginx/sites-enabled/
systemctl restart nginx
echo "Configuring nginx for dashboard done"

# setup temporary chach folder because /tmp is to little
mkdir -p ~/tmpCache
export TMPDIR=~/tmpCache

# python env via poetry and its dependencies
echo "Installing Poetry for user frame"
sudo -u "$USER" bash <<'EOF'

cd "$USER_DIR"

# Check and install rustup/cargo if needed
if ! command -v cargo &> /dev/null; then
    echo 'Installing rustup/cargo'
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
else
    echo 'Rustup/cargo already installed, skipping'
fi

export PATH=$PATH:~/.cargo/bin
export CRYPTOGRAPHY_DONT_BUILD_RUST=1

# Check and install poetry if needed
if [ ! -f "/home/frame/.local/bin/poetry" ]; then
    echo 'Installing poetry'
    curl -sSL https://install.python-poetry.org | python3 - --version 2.1.2
    /home/frame/.local/bin/poetry config virtualenvs.options.system-site-packages true
else
    echo 'Poetry already installed, skipping'
fi

# Install/update project python dependencies
echo 'Installing/updating project python dependencies'
cd "$APPLICATION_DIR/"
/home/frame/.local/bin/poetry install

EOF
echo "Poetry installation complete"

# unset cache folder
rm -rf ~/tmpCache
unset TMPDIR

# service setup
echo "Installing services"
if [ -f "$WORKING_DIR/setup/$APPLICATION_SERVICE_FILE_NAME" ]; then
    cp $WORKING_DIR/setup/$APPLICATION_SERVICE_FILE_NAME /etc/systemd/system/$APPLICATION_SERVICE_FILE_NAME
else
    echo "Warning: $APPLICATION_SERVICE_FILE_NAME file not found!"
fi

if [ -f "$WORKING_DIR/setup/$UPDATE_SERVICE_NAME.timer" ] && [ -f "$WORKING_DIR/setup/$UPDATE_SERVICE_NAME.service" ] && [ -f "$WORKING_DIR/setup/$UPDATE_ALL_SERVICE_NAME.service" ]; then
    cp $WORKING_DIR/setup/$UPDATE_SERVICE_NAME.timer /etc/systemd/system/$UPDATE_SERVICE_NAME.timer
    cp $WORKING_DIR/setup/$UPDATE_SERVICE_NAME.service /etc/systemd/system/$UPDATE_SERVICE_NAME.service
    cp $WORKING_DIR/setup/$UPDATE_ALL_SERVICE_NAME.service /etc/systemd/system/$UPDATE_ALL_SERVICE_NAME.service
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

echo "Installing services done"

# finish installation of shareframe
echo "Installation complete!"