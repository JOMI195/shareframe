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

            subprocess.Popen(
                ["sudo", "systemctl", action, self.service_name],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )

            return True

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
                timeout=10,
            )
            return result.stdout.strip() == "active"
        except Exception as e:
            logger.error(f"Error checking service status: {str(e)}")
            return False

    def wait_for_state(self, expected_state, timeout=600, check_interval=3):
        """
        Wait for the service to reach the expected state within the timeout period.
        """
        start_time = time.time()
        logger.info(
            f"Waiting for {self.service_name} to become {'active' if expected_state else 'inactive'}"
        )

        while time.time() - start_time < timeout:
            current_state = self.is_active()

            if current_state == expected_state:
                logger.info(
                    f"Service {self.service_name} is now {'active' if expected_state else 'inactive'}"
                )
                return True

            logger.debug(
                f"Service state check: currently {'active' if current_state else 'inactive'}, "
                f"waiting for {'active' if expected_state else 'inactive'}"
            )
            time.sleep(check_interval)

        logger.error(
            f"Timeout waiting for {self.service_name} to become "
            f"{'active' if expected_state else 'inactive'} after {timeout} seconds"
        )
        return False
