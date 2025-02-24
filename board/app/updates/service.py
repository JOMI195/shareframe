#!/usr/bin/env python3

import subprocess
import logging
import time

logger = logging.getLogger(__name__)


class ServiceManager:
    """
    Handles systemd service operations with improved error handling and verification.
    """

    def __init__(self, service_name):
        """
        Initialize the service manager.

        Args:
            service_name (str): Name of the systemd service to manage
        """
        self.service_name = service_name

    def manage(self, action):
        """
        Manage the service with better error handling and verification.

        Args:
            action (str): Either 'start' or 'stop'

        Returns:
            bool: True if successful, False otherwise
        """
        valid_actions = ["start", "stop"]
        if action not in valid_actions:
            logger.error(
                f"Invalid service action: {action}. Must be one of {valid_actions}"
            )
            return False

        try:
            logger.info(f"{action.capitalize()}ing {self.service_name} service")

            # Run the systemctl command
            subprocess.run(
                ["sudo", "systemctl", action, self.service_name],
                check=True,
                capture_output=True,
                timeout=300,  # Add timeout to prevent hanging
            )

            # Give the service a moment to change state
            time.sleep(60)

            # Check expected status based on action
            expected_status = "inactive" if action == "stop" else "active"

            # Verify service status with retry
            max_retries = 3
            for attempt in range(max_retries):
                result = subprocess.run(
                    ["sudo", "systemctl", "is-active", self.service_name],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )

                current_status = result.stdout.strip()

                if current_status == expected_status:
                    logger.info(f"{self.service_name} service {action}ed successfully")
                    return True

                if attempt < max_retries - 1:
                    logger.warning(
                        f"Service status check attempt {attempt+1} failed, retrying..."
                    )
                    time.sleep(2)  # Wait before retrying

            logger.error(
                f"{self.service_name} failed to {action} properly. Current status: {current_status}"
            )
            return False

        except subprocess.TimeoutExpired:
            logger.error(f"Timeout while {action}ing service")
            return False
        except subprocess.CalledProcessError as e:
            logger.error(
                f"Failed to {action} service: {e.stderr.decode() if e.stderr else str(e)}"
            )
            return False
        except Exception as e:
            logger.error(f"Unexpected error when {action}ing service: {str(e)}")
            return False

    def stop(self):
        """Stop the service."""
        return self.manage("stop")

    def start(self):
        """Start the service."""
        return self.manage("start")

    def restart(self):
        """
        Restart the service with improved reliability.
        Performs a full stop then start rather than using systemctl restart.
        """
        if not self.stop():
            logger.warning("Failed to stop service cleanly, attempting to start anyway")

        return self.start()

    def is_active(self):
        """
        Check if the service is currently active.

        Returns:
            bool: True if active, False otherwise
        """
        try:
            result = subprocess.run(
                ["sudo", "systemctl", "is-active", self.service_name],
                capture_output=True,
                text=True,
                timeout=120,
            )
            return result.stdout.strip() == "active"
        except Exception as e:
            logger.error(f"Error checking service status: {str(e)}")
            return False
