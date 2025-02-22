#!/usr/bin/env python3

import os
import subprocess
import logging
import tempfile
import hashlib
import requests
import shutil
import time
import json
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
env_serial_path = parent_dir / ".env.serial-number"

load_dotenv(env_serial_path, override=True)

BASE_API_URL = "http://localhost/api"


class TokenManager:
    def __init__(self, logger, token_cache_dir):
        self.logger = logger
        self.token_cache_file = token_cache_dir / "frame_access_token.json"
        self.access_token = None
        self.token_expires_at = None
        self.serial_number = os.getenv("SERIAL_NUMBER")
        self._load_cached_token()

    def _load_cached_token(self):
        try:
            if self.token_cache_file.exists():
                cached_token_data = json.loads(self.token_cache_file.read_text())
                expires_at = datetime.strptime(
                    cached_token_data.get("expires_at", "1970-01-01T00:00:00.000000Z"),
                    "%Y-%m-%dT%H:%M:%S.%fZ",
                ).replace(tzinfo=timezone.utc)

                if datetime.now(timezone.utc) < expires_at:
                    self.access_token = cached_token_data.get("access_token")
                    self.token_expires_at = cached_token_data.get("expires_at")
                    self.logger.info("Successfully loaded cached access token")
                else:
                    self.logger.info("Cached token has expired")
        except Exception as e:
            self.logger.error(f"Error loading cached token: {str(e)}", exc_info=True)

    def _save_cached_token(self):
        try:
            self.token_cache_file.parent.mkdir(parents=True, exist_ok=True)
            token_data = {
                "access_token": self.access_token,
                "expires_at": self.token_expires_at,
            }
            self.token_cache_file.write_text(json.dumps(token_data))
            self.logger.info("Successfully cached access token")
        except Exception as e:
            self.logger.error(f"Error saving cached token: {str(e)}", exc_info=True)

    def verify_token(self) -> bool:
        if not self.access_token:
            self.logger.warning("No access token available for verification")
            return False
        try:
            response = requests.post(
                f"{BASE_API_URL}/frames/verify-frame-token/",
                json={"access_token": self.access_token},
                timeout=600,
            )
            is_valid = response.status_code == 200
            self.logger.info(f"Token verification result: {is_valid}")
            return is_valid
        except Exception as e:
            self.logger.error(f"Token verification failed: {str(e)}", exc_info=True)
            return False

    def is_token_valid(self) -> bool:
        if not self.access_token or not self.token_expires_at:
            self.logger.warning("Missing token or expiration time")
            return False
        try:
            expires_at = datetime.strptime(
                self.token_expires_at, "%Y-%m-%dT%H:%M:%S.%fZ"
            ).replace(tzinfo=timezone.utc)
            is_valid = datetime.now(timezone.utc) < expires_at
            self.logger.debug(
                f"Token validity check: {is_valid}, expires at {expires_at}"
            )
            return is_valid
        except ValueError as e:
            self.logger.error(
                f"Error parsing token expiration time: {str(e)}", exc_info=True
            )
            return False

    def obtain_token(self) -> bool:
        self.logger.info("Attempting to obtain new token")
        try:
            response = requests.post(
                f"{BASE_API_URL}/frames/obtain-frame-ws-auth-token/",
                data={"private_serial_number": self.serial_number},
                timeout=600,
            )
            response.raise_for_status()
            token_data = response.json()
            self.access_token = token_data["access_token"]
            self.token_expires_at = token_data["expires_at"]
            self.logger.info(
                f"New token obtained successfully. Expires at: {self.token_expires_at}"
            )
            self._save_cached_token()
            return True
        except Exception as e:
            self.logger.error(f"Failed to obtain new token: {str(e)}", exc_info=True)
            return False

    def get_auth_headers(self):
        """Get the authentication headers for API requests"""
        return (
            {"Authorization": f"Frame-Access-Token {self.access_token}"}
            if self.access_token
            else {}
        )


class UpdateManager:
    def __init__(self):
        # Get the installation directory (two levels up from this script)
        self.install_dir = Path(__file__).resolve().parent.parent / "app"
        self.backup_dir = self.install_dir.parent / "shareframe_backups"
        self.version_file = self.install_dir / "version.txt"

        # Configure logging
        self.log_dir = Path("/var/log/shareframe")
        self.log_dir.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(self.log_dir / "shareframe-updater.log"),
                logging.StreamHandler(),
            ],
        )
        self.logger = logging.getLogger("shareframe-updater")

        # Initialize token manager
        self.token_manager = TokenManager(self.logger, self.install_dir / ".cache")

        # Configuration
        self.service_name = "shareframe"
        self.api_base_url = f"{BASE_API_URL}/frame-updates/"

        self.logger.info(f"Install directory: {self.install_dir}")
        self.logger.info(f"Backup directory: {self.backup_dir}")
        self.logger.info(f"Version file: {self.version_file}")

    def get_current_version(self):
        """Read the current version from version file"""
        try:
            return self.version_file.read_text().strip()
        except FileNotFoundError:
            self.logger.warning(
                "Version file not found. Assuming initial installation."
            )
            return "0.0.0"

    def get_latest_version_info(self):
        """Get information about the latest version from the API"""
        try:
            response = requests.get(
                f"{self.api_base_url}/latest",
                headers=self.token_manager.get_auth_headers(),
                timeout=600,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error checking for updates: {str(e)}")
            return None

    def download_update(self, version_info, temp_dir):
        """Download the update package"""
        update_file = Path(temp_dir) / "update.tar.gz"

        try:
            self.logger.info(f"Downloading update from {version_info['download_url']}")
            response = requests.get(
                version_info["download_url"],
                headers=self.token_manager.get_auth_headers(),
                stream=True,
                timeout=60,
            )
            response.raise_for_status()

            update_file.write_bytes(response.content)
            return update_file
        except Exception as e:
            self.logger.error(f"Error downloading update: {str(e)}")
            return None

    def verify_update(self, update_file, version_info):
        """Verify the integrity of the downloaded update"""
        try:
            # Calculate SHA256 of the downloaded file
            sha256_hash = hashlib.sha256()
            sha256_hash.update(update_file.read_bytes())
            actual_checksum = sha256_hash.hexdigest()

            if actual_checksum != version_info["checksum"]:
                self.logger.error("Checksum verification failed!")
                self.logger.error(f"Expected: {version_info['checksum']}")
                self.logger.error(f"Actual: {actual_checksum}")
                return False

            self.logger.info("Checksum verification successful")
            return True
        except Exception as e:
            self.logger.error(f"Error verifying update: {str(e)}")
            return False

    def backup_current_installation(self):
        """Create a backup of the current installation"""
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"shareframe_backup_{timestamp}"

        try:
            self.logger.info(f"Creating backup at {backup_path}")
            shutil.copytree(self.install_dir, backup_path, symlinks=True)
            return backup_path
        except Exception as e:
            self.logger.error(f"Backup failed: {str(e)}")
            return None

    def install_update(self, update_file, version_info, temp_dir):
        """Extract and install the update"""
        extract_path = Path(temp_dir) / "extracted"

        try:
            # Extract the archive
            extract_path.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                ["tar", "-xzf", str(update_file), "-C", str(extract_path)],
                check=True,
                capture_output=True,
            )

            # Stop the service
            self.logger.info(f"Stopping {self.service_name} service")
            subprocess.run(
                ["systemctl", "stop", self.service_name],
                check=True,
                capture_output=True,
            )

            # Install the update
            self.logger.info("Installing update")
            for item in extract_path.iterdir():
                dest = self.install_dir / item.name
                if item.is_dir():
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest, symlinks=True)
                else:
                    shutil.copy2(item, dest)

            # Update version file
            self.version_file.write_text(version_info["version"])

            return True
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Command failed: {e.cmd}")
            self.logger.error(f"Output: {e.stdout}")
            self.logger.error(f"Error: {e.stderr}")
            return False
        except Exception as e:
            self.logger.error(f"Update installation failed: {str(e)}")
            return False

    def restart_service(self):
        """Restart the service"""
        try:
            self.logger.info(f"Starting {self.service_name} service")
            subprocess.run(
                ["systemctl", "start", self.service_name],
                check=True,
                capture_output=True,
            )

            # Verify service is running
            result = subprocess.run(
                ["systemctl", "is-active", self.service_name],
                capture_output=True,
                text=True,
            )
            if result.stdout.strip() == "active":
                self.logger.info(f"{self.service_name} service started successfully")
                return True
            else:
                self.logger.error(f"{self.service_name} failed to start properly")
                return False
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to start service: {e.stderr}")
            return False

    def rollback_update(self, backup_path):
        """Rollback to the previous version if update fails"""
        try:
            self.logger.warning("Performing rollback to previous version")

            # Stop the service first
            subprocess.run(
                ["systemctl", "stop", self.service_name],
                check=True,
                capture_output=True,
            )

            # Remove the failed update
            for item in self.install_dir.iterdir():
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()

            # Restore from backup
            for item in Path(backup_path).iterdir():
                dest = self.install_dir / item.name
                if item.is_dir():
                    shutil.copytree(item, dest, symlinks=True)
                else:
                    shutil.copy2(item, dest)

            # Restart the service
            self.restart_service()
            self.logger.info("Rollback completed successfully")
        except Exception as e:
            self.logger.critical(f"Rollback failed: {str(e)}")
            self.logger.critical(
                "System may be in an inconsistent state. Manual intervention required."
            )

    def update(self):
        """Main update process"""
        self.logger.info("Starting update process")

        # Ensure we have a valid token
        if not self.token_manager.is_token_valid():
            if not self.token_manager.obtain_token():
                self.logger.error("Failed to obtain valid token. Aborting update.")
                return

        # Get current version
        current_version = self.get_current_version()
        self.logger.info(f"Current version: {current_version}")

        # Check for new version
        latest_version_info = self.get_latest_version_info()
        if not latest_version_info:
            self.logger.error("Failed to get latest version information")
            return

        if latest_version_info["version"] == current_version:
            self.logger.info("Already running the latest version")
            return

        self.logger.info(
            f"New version {latest_version_info['version']} available. Starting update process."
        )

        # Create temporary directory for update files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download the update
            update_file = self.download_update(latest_version_info, temp_dir)
            if not update_file:
                self.logger.error("Failed to download update")
                return

            # Verify the update
            if not self.verify_update(update_file, latest_version_info):
                self.logger.error("Update verification failed")
                return

            # Backup current installation
            backup_path = self.backup_current_installation()
            if not backup_path:
                self.logger.error("Failed to create backup, aborting update")
                return

            # Install the update
            if self.install_update(update_file, latest_version_info, temp_dir):
                # Update succeeded, restart the service
                if self.restart_service():
                    self.logger.info(
                        f"Update to version {latest_version_info['version']} completed successfully"
                    )
                else:
                    self.logger.error("Service failed to restart after update")
                    self.rollback_update(backup_path)
            else:
                self.logger.error("Update installation failed")
                self.rollback_update(backup_path)


if __name__ == "__main__":
    updater = UpdateManager()
    updater.update()
