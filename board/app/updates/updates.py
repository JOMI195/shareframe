#!/usr/bin/env python3

import hmac
from pathlib import Path
import subprocess
import logging
import tempfile
import hashlib
import requests
import shutil
import time
import json

from service.service import ServiceManager
from display.display import clear_display

logger = logging.getLogger(__name__)


def hmac_encode(message, key):
    return hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest()


class UpdateManager:
    """
    Manages the software update process including version checking,
    downloading, verification, backup, installation, and rollback.
    """

    def __init__(
        self,
        application_service_manager: ServiceManager,
        dashboard_service_manager: ServiceManager,
        heartbeat_service_manager: ServiceManager,
        install_dir: Path,
        update_files_dir_name: str,
        backup_dir: Path,
        update_url: str,
        auth_headers: dict,
        files_to_backup_list_name: str,
        files_to_delete_list_name: str,
        scripts_to_run_list_name: str,
        update_hash_secret_key: str,
        version: str,
        criticalities_to_update_immediately: list[str],
        backup_all: bool,
        delete_all: bool,
    ):
        """
        Initialize the update manager.
        """
        self.application_service_manager = application_service_manager
        self.dashboard_service_manager = dashboard_service_manager
        self.heartbeat_service_manager = heartbeat_service_manager

        self.install_dir = install_dir
        self.update_files_dir_name = update_files_dir_name
        self.scripts_to_run_dir_name = install_dir / update_files_dir_name / "scripts"
        self.backup_dir = backup_dir
        self.files_to_backup_file = (
            install_dir / update_files_dir_name / files_to_backup_list_name
        )
        self.files_to_delete_file = (
            install_dir / update_files_dir_name / files_to_delete_list_name
        )
        self.scripts_to_run_list_name = scripts_to_run_list_name
        self.update_hash_secret_key = update_hash_secret_key
        self.update_url = update_url
        self.auth_headers = auth_headers
        self.version = version
        self.criticalities_to_update_immediately = criticalities_to_update_immediately
        self.backup_all = backup_all
        self.delete_all = delete_all

    def get_latest_version_info(self):
        """
        Get information about the latest version from the API.
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

    def verify_update(self, update_file, latest_version_info):
        """
        Verify the integrity of the downloaded update.
        """
        try:
            sha256_hash = hashlib.sha256()
            sha256_hash.update(update_file.read_bytes())
            actual_checksum = sha256_hash.hexdigest()

            encoded_checksum = hmac_encode(actual_checksum, self.update_hash_secret_key)

            if encoded_checksum != latest_version_info["checksum"]:
                logger.error(
                    f"Checksum verification failed!\nExpected: {latest_version_info['checksum']}\nActual: {encoded_checksum}"
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
        """
        try:
            if not self.files_to_backup_file.exists():
                logger.warning("Files list not found. Creating empty list.")
                return []

            with open(self.files_to_backup_file, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading files list: {str(e)}")
            return []

    def get_files_to_delete(self):
        """
        Get the list of files to delete from the files_to_delete.json file.
        """
        try:
            if not self.files_to_delete_file.exists():
                logger.info("No files_to_delete.json found in update package")
                return []

            with open(self.files_to_delete_file, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading files to delete list: {str(e)}")
            return []

    def is_safe_path(self, path_str):
        """
        Check if a path is safe to use (not trying to traverse outside installation directory).
        """
        # Check for dangerous path components
        dangerous_patterns = ["/", "\\", "..", "~"]
        for pattern in dangerous_patterns:
            if pattern in path_str:
                logger.warning(
                    f"Dangerous pattern '{pattern}' found in path: {path_str}"
                )
                return False

        # Ensure the resolved path is within the installation directory
        try:
            # Convert to absolute path and resolve any symlinks or relative components
            test_path = (self.install_dir / path_str).resolve()
            install_path = self.install_dir.resolve()

            # Check if the path is within the installation directory
            if not str(test_path).startswith(str(install_path)):
                logger.warning(
                    f"Path traversal attempt detected: {path_str} resolves outside install directory"
                )
                return False
        except Exception as e:
            logger.error(f"Error validating path '{path_str}': {str(e)}")
            return False

        return True

    def backup_specified_files(self):
        """
        Backup only the files specified in the files list or the entire installation directory
        if backup_all is True.
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

            if self.backup_all:
                # Backup the entire installation directory
                logger.info("Backing up entire installation directory")

                # Create destination path
                dest_path = backup_path
                dest_path.mkdir(parents=True, exist_ok=True)

                for item in self.install_dir.iterdir():
                    if item.is_file():
                        shutil.copy2(item, dest_path / item.name)
                        logger.info(f"Backed up file: {item.name}")
                    elif item.is_dir():
                        shutil.copytree(item, dest_path / item.name)
                        logger.info(f"Backed up directory: {item.name}")

                logger.info("Full backup completed successfully")
            else:
                # Get the list of files to backup
                files_to_backup = self.get_files_to_backup()

                # Backup each file in the list
                for file_path in files_to_backup:
                    # Safety check: Skip dangerous paths
                    if not self.is_safe_path(file_path):
                        logger.warning(
                            f"Skipping potentially dangerous path: {file_path}"
                        )
                        continue

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

                if self.files_to_backup_file.exists():
                    shutil.copy2(
                        self.files_to_backup_file,
                        backup_path / self.files_to_backup_file.name,
                    )

                logger.info("Selective backup completed successfully")

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

    def delete_files(self):
        """
        Delete files based on configuration.

        If delete_all is True, deletes everything in the installation directory
        except the backup directory. Otherwise, deletes only the files specified
        in the files_to_delete.json file.
        """
        try:
            if self.delete_all:
                # Delete everything in the installation directory except the backup directory
                logger.warning("Deleting entire installation directory contents")
                for item in self.install_dir.iterdir():
                    if item.is_file():
                        item.unlink()
                        logger.info(f"Deleted file: {item.name}")
                    elif item.is_dir():
                        shutil.rmtree(item)
                        logger.info(f"Deleted directory: {item.name}")

                logger.info("Full deletion completed successfully")
            else:
                # Delete files specified in files_to_delete.json
                files_to_delete = self.get_files_to_delete()

                if not files_to_delete:
                    logger.info("No files specified for deletion")
                    return True

                logger.info(
                    f"Deleting {len(files_to_delete)} specified files/directories"
                )
                for file_path in files_to_delete:
                    # Safety check: Skip dangerous paths
                    if not self.is_safe_path(file_path):
                        logger.warning(
                            f"Skipping potentially dangerous path: {file_path}"
                        )
                        continue

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

                logger.info("Selective deletion completed successfully")

            return True

        except Exception as e:
            logger.error(f"Deletion failed: {str(e)}")
            return False

    def run_update_scripts(self):
        """
        Run the scripts listed in the scripts_to_run_list file.
        These scripts are located in the scripts_to_run_dir_name directory.
        Scripts are run with sudo if needed based on the configuration in the list.
        """
        try:
            scripts_to_run_list_file = (
                self.install_dir
                / self.update_files_dir_name
                / self.scripts_to_run_list_name
            )

            if not scripts_to_run_list_file.exists():
                logger.info(f"No scripts list file found at {scripts_to_run_list_file}")
                return True

            with open(scripts_to_run_list_file, "r") as f:
                scripts_data = json.load(f)

            if not scripts_data:
                logger.info("No scripts to run")
                return True

            # Handle different formats of scripts data
            # It could be a simple list of script names or a dict with additional info
            if isinstance(scripts_data, list) and all(
                isinstance(item, str) for item in scripts_data
            ):
                scripts_to_run = [
                    {"name": name, "sudo": False} for name in scripts_data
                ]
            else:
                scripts_to_run = scripts_data

            if not self.scripts_to_run_dir_name.exists():
                logger.error(
                    f"Scripts directory not found: {self.scripts_to_run_dir_name}"
                )
                return False

            for script_info in scripts_to_run:
                if isinstance(script_info, str):
                    script_name = script_info
                    needs_sudo = False
                else:
                    script_name = script_info["name"]
                    needs_sudo = script_info.get("sudo", False)

                script_path = self.scripts_to_run_dir_name / script_name

                if not script_path.exists():
                    logger.error(f"Script not found: {script_path}")
                    return False

                # Make script executable
                script_path.chmod(
                    script_path.stat().st_mode | 0o111
                )  # Add executable bit

                if needs_sudo:
                    cmd = ["sudo", str(script_path)]
                    logger.info(f"Running script with sudo: {script_name}")
                else:
                    cmd = [str(script_path)]
                    logger.info(f"Running script: {script_name}")

                result = subprocess.run(
                    cmd, check=False, capture_output=True, text=True
                )

                if result.returncode != 0:
                    logger.error(
                        f"Script {script_name} failed with exit code {result.returncode}"
                    )
                    logger.error(f"Script stdout: {result.stdout}")
                    logger.error(f"Script stderr: {result.stderr}")
                    return False

                logger.info(f"Script {script_name} completed successfully")

            logger.info("All scripts executed successfully")
            return True

        except Exception as e:
            logger.error(f"Error running update scripts: {str(e)}")
            return False

    def install_update(self, extract_path):
        """
        Install the update by replacing files.
        """
        try:
            # First delete files according to configuration
            if not self.delete_files():
                logger.error("Failed to delete files before installation")
                return False

            # Copy files from the extract path to the install dir
            logger.info("Installing update files")
            for item in extract_path.glob("**/*"):
                if item.is_file():
                    # Get relative path
                    rel_path = item.relative_to(extract_path)

                    dest_path = self.install_dir / rel_path

                    # Ensure parent directory exists
                    dest_path.parent.mkdir(parents=True, exist_ok=True)

                    # Copy the file
                    shutil.copy2(item, dest_path)
                    logger.info(f"Updated file: {rel_path}")

            return True

        except Exception as e:
            logger.error(f"Update installation failed: {str(e)}")
            return False

    def rollback_update(self, backup_path):
        """
        Rollback to the previous version using the backup.
        """
        try:
            logger.warning("Performing rollback to previous version")

            # Make sure service is stopped
            if self.application_service_manager.is_active():
                if not self.application_service_manager.stop():
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
            if self.application_service_manager.start():
                logger.info("Rollback completed successfully")
                return True
            else:
                logger.critical("Service failed to start after rollback")
                return False

        except Exception as e:
            logger.critical(f"Rollback failed: {str(e)}")

            # Try to start service even if rollback failed
            try:
                self.application_service_manager.start()
                self.dashboard_service_manager.start()
                self.heartbeat_service_manager.start()
            except Exception as restart_error:
                logger.critical(
                    f"Failed to start service after failed rollback: {str(restart_error)}"
                )

            return False

    def extract_update(self, update_file, temp_dir):
        """
        Extract the update package.
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
        current_version = self.version
        logger.info(f"Current version: {current_version}")

        # Check for new version
        latest_version_info = self.get_latest_version_info()
        if not latest_version_info:
            logger.error("Failed to get latest version information")
            return False

        if latest_version_info["version"] == current_version:
            logger.info("Already running the latest version")
            return True

        if (
            self.criticalities_to_update_immediately is not None
            and latest_version_info["criticality"]
            not in self.criticalities_to_update_immediately
        ):
            logger.info("Update not considered critical, skipping")
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

            if not self.verify_update(
                update_file=update_file, latest_version_info=latest_version_info
            ):
                logger.error("Update verification failed")
                return False

            # Create backup
            backup_path = self.backup_specified_files()
            if not backup_path:
                logger.error("Failed to create backup, aborting update")
                return False

            # Extract the update
            extract_path = self.extract_update(
                update_file=update_file, temp_dir=temp_dir
            )
            if not extract_path:
                logger.error("Failed to extract update")
                return False

            # Now that everything is prepared, stop the service
            if not (
                self.application_service_manager.stop()
                and self.application_service_manager.wait_for_state(
                    expected_state=False
                )
            ):
                logger.error("Failed to stop service, aborting update")
                return False

            if not (
                self.dashboard_service_manager.stop()
                and self.dashboard_service_manager.wait_for_state(expected_state=False)
            ):
                logger.error("Failed to stop dashboard service, aborting update")
                return False

            if not (
                self.heartbeat_service_manager.stop()
                and self.heartbeat_service_manager.wait_for_state(expected_state=False)
            ):
                logger.error("Failed to stop heartbeat service, aborting update")
                return False

            # Clear the display
            if not clear_display():
                logger.error("Failed to clear display, aborting update")
                return False

            # Apply the update
            update_success = self.install_update(extract_path=extract_path)
            if not update_success:
                logger.error("Update installation failed")
                # Perform rollback before attempting to restart services
                rollback_successful = self.rollback_update(backup_path=backup_path)
                if rollback_successful:
                    logger.info("Rollback completed successfully")
                else:
                    logger.critical(
                        "Rollback failed. System may be in an inconsistent state."
                    )

                # Try to restart services after rollback
                self.application_service_manager.start() and self.application_service_manager.wait_for_state(
                    expected_state=True
                )
                self.dashboard_service_manager.start() and self.dashboard_service_manager.wait_for_state(
                    expected_state=True
                )
                self.heartbeat_service_manager.start() and self.heartbeat_service_manager.wait_for_state(
                    expected_state=True
                )

                return False

            # Run additional scripts
            scripts_success = self.run_update_scripts()
            if not scripts_success:
                logger.error("Scripts execution failed")
                # Perform rollback before attempting to restart services
                rollback_successful = self.rollback_update(backup_path=backup_path)
                if rollback_successful:
                    logger.info("Rollback completed successfully")
                else:
                    logger.critical(
                        "Rollback failed. System may be in an inconsistent state."
                    )

                # Try to restart services after rollback
                self.application_service_manager.start() and self.application_service_manager.wait_for_state(
                    expected_state=True
                )
                self.dashboard_service_manager.start() and self.dashboard_service_manager.wait_for_state(
                    expected_state=True
                )
                self.heartbeat_service_manager.start() and self.heartbeat_service_manager.wait_for_state(
                    expected_state=True
                )

                return False

            # At this point both update and scripts were successful, restart services
            application_service_started = (
                self.application_service_manager.start()
                and self.application_service_manager.wait_for_state(expected_state=True)
            )

            dashboard_service_started = (
                self.dashboard_service_manager.start()
                and self.dashboard_service_manager.wait_for_state(expected_state=True)
            )

            heartbeat_service_started = (
                self.heartbeat_service_manager.start()
                and self.heartbeat_service_manager.wait_for_state(expected_state=True)
            )

            # Check if all services started properly
            if (
                application_service_started
                and dashboard_service_started
                and heartbeat_service_started
            ):
                logger.info(
                    f"Update to version {latest_version_info['version']} completed successfully"
                )
                return True
            else:
                # One or more services failed to start after successful update
                if not application_service_started:
                    logger.error("Application service failed to start after update")
                if not dashboard_service_started:
                    logger.error("Dashboard service failed to start after update")
                if not heartbeat_service_started:
                    logger.error("Heartbeat service failed to start after update")

                # Attempt rollback
                rollback_successful = self.rollback_update(backup_path=backup_path)
                if rollback_successful:
                    logger.info("Rollback completed successfully")
                    # Try to restart services after rollback
                    self.application_service_manager.start() and self.application_service_manager.wait_for_state(
                        expected_state=True
                    )
                    self.dashboard_service_manager.start() and self.dashboard_service_manager.wait_for_state(
                        expected_state=True
                    )
                    self.heartbeat_service_manager.start() and self.heartbeat_service_manager.wait_for_state(
                        expected_state=True
                    )
                else:
                    logger.critical(
                        "Rollback failed. System may be in an inconsistent state."
                    )

                return False
