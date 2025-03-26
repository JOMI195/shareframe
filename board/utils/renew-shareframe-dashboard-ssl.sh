#!/bin/bash

# Set file paths
CERT_PATH="/home/frame/shareframe/.ssl/shareframe-frame-dashboard-cert.pem"
KEY_PATH="/home/frame/shareframe/.ssl/shareframe-frame-dashboard-key.pem"
LOG_DIR="/var/log/shareframe"
LOG_FILE="${LOG_DIR}/renew-shareframe-dashboard-ssl.log"
DASHBOARD_SERVICE_NAME="shareframe-dashboard"
DASHBOARD_SERVICE_FILE_NAME="$DASHBOARD_SERVICE_NAME.service"

# Create the log directory if it doesn't exist
mkdir -p $LOG_DIR

# Function to log messages
log_message() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Log script start
log_message "Starting SSL certificate renewal process."

# Check if old certificate and key exist, and log that
if [[ -f $CERT_PATH && -f $KEY_PATH ]]; then
  log_message "Removing old SSL certificate and key."
  rm -f $CERT_PATH $KEY_PATH
else
  log_message "No existing SSL certificate or key found."
fi

# Generate new certificate and key
log_message "Generating new SSL certificate and key."
openssl req -x509 -newkey rsa:4096 -nodes \
  -out $CERT_PATH \
  -keyout $KEY_PATH \
  -days 365 \
  -subj "/C=DE/ST=Baden-Württemberg/L=Konstanz/O=Shareframe/OU=Development/CN=Johannes Middelberg"

# Check if the generation was successful and log result
if [[ $? -eq 0 ]]; then
  log_message "SSL certificate successfully renewed."
else
  log_message "Error occurred while renewing SSL certificate."
  exit 1
fi

# Restart the dashboard service to apply the new certificate
log_message "Restarting the $DASHBOARD_SERVICE_NAME service."
systemctl restart $DASHBOARD_SERVICE_FILE_NAME

# Check if the service restart was successful and log result
if [[ $? -eq 0 ]]; then
  log_message "$DASHBOARD_SERVICE_NAME service restarted successfully."
else
  log_message "Failed to restart the $DASHBOARD_SERVICE_NAME service."
  exit 1
fi

# Final log message
log_message "SSL certificate renewal process completed."
