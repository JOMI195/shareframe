#!/usr/bin/env python3

from pathlib import Path
import subprocess
import logging
import tempfile
import hashlib
import requests
import shutil
import time
import json

from .service import ServiceManager
from .display import clear_display

logger = logging.getLogger(__name__)


class UpdateManager:
    """
    Manages the software update process including version checking,
    downloading, verification, backup, installation, and rollback.
    """

    def __init__(
        self,
        service_manager: ServiceManager,
        install_dir: Path,
        backup_dir: Path,
        version_file_name: str,
        update_url: str,
        auth_headers: dict,
        files_list_name: str,
        files_to_delete_list_name: str,
    ):
        """
        Initialize the update manager.

        Args:
            service_manager: ServiceManager instance to manage the service
            install_dir (Path): Directory where the software is installed
            backup_dir (Path): Directory to store backups
            version_file_name (str): Name of the file that stores version info
            update_url (str): URL to check for updates
            auth_headers (dict): Headers for API authentication
            files_list_name (str): Name of the file containing the list of files to backup
        """
        self.service_manager = service_manager
        self.install_dir = install_dir
        self.backup_dir = backup_dir
        self.version_file = install_dir / version_file_name
        self.files_list_file = install_dir / files_list_name
        self.files_to_delete_list = install_dir / files_to_delete_list_name
        self.update_url = update_url
        self.auth_headers = auth_headers

    def get_current_version(self):
        """
        Read the current version from version file.

        Returns:
            str: Current version
        """
        try:
            return self.version_file.read_text().strip()
        except FileNotFoundError:
            logger.warning("Version file not found. Assuming initial installation.")
            return "0.0.0"

    def get_latest_version_info(self):
        """
        Get information about the latest version from the API.

        Returns:
            dict: Version information or None if failed
        """
        try:
            response = requests.get(
                self.update_url,
                headers=self.auth_headers,
                timeout=600,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error checking for updates: {str(e)}")
            return None

    def download_update(self, version_info, temp_dir):
        """
        Download the update package.

        Args:
            version_info (dict): Information about the version to download
            temp_dir (str): Temporary directory to store the download

        Returns:
            Path: Path to the downloaded file or None if failed
        """
        update_file = Path(temp_dir) / "update.tar.gz"

        try:
            logger.info(f"Downloading update from {version_info['download_url']}")
            response = requests.get(
                version_info["download_url"],
                headers=self.auth_headers,
                stream=True,
                timeout=600,
            )
            response.raise_for_status()

            update_file.write_bytes(response.content)
            return update_file
        except Exception as e:
            logger.error(f"Error downloading update: {str(e)}")
            return None

    def verify_update(self, update_file, version_info):
        """
        Verify the integrity of the downloaded update.

        Args:
            update_file (Path): Path to the downloaded update file
            version_info (dict): Information about the version with checksum

        Returns:
            bool: True if verification passed, False otherwise
        """
        try:
            sha256_hash = hashlib.sha256()
            sha256_hash.update(update_file.read_bytes())
            actual_checksum = sha256_hash.hexdigest()

            if actual_checksum != version_info["checksum"]:
                logger.error(
                    f"Checksum verification failed! Expected: {version_info['checksum']}, Actual: {actual_checksum}"
                )
                return False

            logger.info("Checksum verification successful")
            return True
        except Exception as e:
            logger.error(f"Error verifying update: {str(e)}")
            return False

    def get_files_to_backup(self):
        """
        Get the list of files to backup from the files_to_backup.json file.

        Returns:
            list: List of file paths to backup
        """
        try:
            if not self.files_list_file.exists():
                logger.warning("Files list not found. Creating empty list.")
                return []

            with open(self.files_list_file, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading files list: {str(e)}")
            return []

    def get_files_to_delete(self, extract_path):
        """
        Get the list of files to delete from the files_to_delete.json file.

        Args:
            extract_path (Path): Path where the update is extracted

        Returns:
            list: List of file paths to delete
        """
        try:
            if not self.files_to_delete_list.exists():
                logger.info("No files_to_delete.json found in update package")
                return []

            with open(self.files_to_delete_list, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading files to delete list: {str(e)}")
            return []

    def backup_specified_files(self):
        """
        Backup only the files specified in the files list.

        Returns:
            Path: Path to the backup directory or None if failed
        """
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        # Clean old backups
        try:
            for old_backup in self.backup_dir.iterdir():
                if old_backup.is_dir():
                    shutil.rmtree(old_backup)
                    logger.info(f"Deleted old backup: {old_backup}")
        except Exception as e:
            logger.warning(f"Failed to delete old backups: {str(e)}")

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"shareframe_backup_{timestamp}"

        try:
            logger.info(f"Creating backup at {backup_path}")
            backup_path.mkdir(parents=True)

            # Get the list of files to backup
            files_to_backup = self.get_files_to_backup()

            # Backup each file in the list
            for file_path in files_to_backup:
                source_path = self.install_dir / file_path
                dest_path = backup_path / file_path

                if source_path.exists():
                    # Ensure the destination directory exists
                    dest_path.parent.mkdir(parents=True, exist_ok=True)

                    if source_path.is_file():
                        shutil.copy2(source_path, dest_path)
                        logger.info(f"Backed up file: {file_path}")
                    elif source_path.is_dir():
                        shutil.copytree(source_path, dest_path)
                        logger.info(f"Backed up directory: {file_path}")
                else:
                    logger.warning(f"File not found for backup: {file_path}")

            # Also backup version file and files list
            if self.version_file.exists():
                shutil.copy2(self.version_file, backup_path / self.version_file.name)

            if self.files_list_file.exists():
                shutil.copy2(
                    self.files_list_file, backup_path / self.files_list_file.name
                )

            logger.info("Backup completed successfully")
            return backup_path

        except Exception as e:
            logger.error(f"Backup failed: {str(e)}")
            if backup_path.exists():
                try:
                    shutil.rmtree(backup_path)
                    logger.info("Cleaned up failed backup directory")
                except Exception as cleanup_error:
                    logger.error(
                        f"Failed to clean up backup directory: {str(cleanup_error)}"
                    )
            return None

    def install_update(self, update_file, version_info, extract_path):
        """
        Install the update by replacing files.

        Args:
            update_file (Path): Path to the downloaded update file
            version_info (dict): Information about the version
            extract_path (Path): Path where the update is extracted

        Returns:
            bool: True if installation succeeded, False otherwise
        """
        try:
            # Delete files specified in files_to_delete.json
            files_to_delete = self.get_files_to_delete(extract_path)
            for file_path in files_to_delete:
                delete_path = self.install_dir / file_path
                if delete_path.exists():
                    if delete_path.is_file():
                        delete_path.unlink()
                        logger.info(f"Deleted file: {file_path}")
                    elif delete_path.is_dir():
                        shutil.rmtree(delete_path)
                        logger.info(f"Deleted directory: {file_path}")
                else:
                    logger.warning(f"Path not found for deletion: {file_path}")

            # Copy files from the extract path to the install dir
            logger.info("Installing update files")
            for item in extract_path.glob("**/*"):
                if item.is_file():
                    # Get relative path
                    rel_path = item.relative_to(extract_path)

                    # Skip files_to_delete.json file
                    if rel_path.name == "files_to_delete.json":
                        continue

                    dest_path = self.install_dir / rel_path

                    # Ensure parent directory exists
                    dest_path.parent.mkdir(parents=True, exist_ok=True)

                    # Copy the file
                    shutil.copy2(item, dest_path)
                    logger.info(f"Updated file: {rel_path}")

            # Update version file
            self.version_file.write_text(version_info["version"])
            logger.info(f"Updated version file to {version_info['version']}")

            return True

        except Exception as e:
            logger.error(f"Update installation failed: {str(e)}")
            return False

    def rollback_update(self, backup_path):
        """
        Rollback to the previous version using the backup.

        Args:
            backup_path (Path): Path to the backup directory

        Returns:
            bool: True if rollback succeeded, False otherwise
        """
        try:
            logger.warning("Performing rollback to previous version")

            # Make sure service is stopped
            if self.service_manager.is_active():
                if not self.service_manager.stop():
                    logger.warning(
                        "Failed to stop service for rollback, continuing anyway"
                    )

            # Restore files from backup
            for item in backup_path.glob("**/*"):
                if item.is_file():
                    # Get relative path
                    rel_path = item.relative_to(backup_path)
                    dest_path = self.install_dir / rel_path

                    # Ensure parent directory exists
                    dest_path.parent.mkdir(parents=True, exist_ok=True)

                    # Copy the file
                    shutil.copy2(item, dest_path)
                    logger.info(f"Restored file: {rel_path}")

            # Start the service
            if self.service_manager.start():
                logger.info("Rollback completed successfully")
                return True
            else:
                logger.critical("Service failed to start after rollback")
                return False

        except Exception as e:
            logger.critical(f"Rollback failed: {str(e)}")

            # Try to start service even if rollback failed
            try:
                self.service_manager.start()
            except Exception as restart_error:
                logger.critical(
                    f"Failed to start service after failed rollback: {str(restart_error)}"
                )

            return False

    def extract_update(self, update_file, temp_dir):
        """
        Extract the update package.

        Args:
            update_file (Path): Path to the downloaded update file
            temp_dir (str): Temporary directory to extract to

        Returns:
            Path: Path to the extracted directory or None if failed
        """
        extract_path = Path(temp_dir) / "extracted"
        try:
            extract_path.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                ["tar", "-xzf", str(update_file), "-C", str(extract_path)],
                check=True,
                capture_output=True,
            )
            logger.info("Update package extracted successfully")
            return extract_path
        except Exception as e:
            logger.error(f"Failed to extract update package: {str(e)}")
            return None

    def check_and_apply_update(self):
        """
        Main method to check for and apply updates.

        Returns:
            bool: True if update succeeded or no update needed, False if failed
        """
        # Get current version
        current_version = self.get_current_version()
        logger.info(f"Current version: {current_version}")

        # Check for new version
        latest_version_info = self.get_latest_version_info()
        if not latest_version_info:
            logger.error("Failed to get latest version information")
            return False

        if latest_version_info["version"] == current_version:
            logger.info("Already running the latest version")
            return True

        logger.info(
            f"New version {latest_version_info['version']} available. Starting update process."
        )

        # Create temporary directory for update files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download and verify the update before stopping the service
            update_file = self.download_update(latest_version_info, temp_dir)
            if not update_file:
                logger.error("Failed to download update")
                return False

            if not self.verify_update(update_file, latest_version_info):
                logger.error("Update verification failed")
                return False

            # Create backup before stopping service to minimize downtime
            backup_path = self.backup_specified_files()
            if not backup_path:
                logger.error("Failed to create backup, aborting update")
                return False

            # Extract the update in advance to minimize downtime
            extract_path = self.extract_update(update_file, temp_dir)
            if not extract_path:
                logger.error("Failed to extract update")
                return False

            # Now that everything is prepared, stop the service
            if not self.service_manager.stop():
                logger.error("Failed to stop service, aborting update")
                return False

            # Clear the display
            if not clear_display():
                logger.error("Failed to clear display, aborting update")
                return False

            # Apply the update
            update_success = self.install_update(
                update_file, latest_version_info, extract_path
            )

            # Start the service regardless of update success
            # If update failed, we'll roll back after trying to start
            service_started = self.service_manager.start()

            # Handle success/failure
            if update_success and service_started:
                logger.info(
                    f"Update to version {latest_version_info['version']} completed successfully"
                )
                return True
            else:
                if not update_success:
                    logger.error("Update installation failed")
                if not service_started:
                    logger.error("Service failed to start after update")

                # Attempt rollback
                rollback_successful = self.rollback_update(backup_path)

                if rollback_successful:
                    logger.info("Rollback completed successfully")
                else:
                    logger.critical(
                        "Rollback failed. System may be in an inconsistent state."
                    )

                return False
