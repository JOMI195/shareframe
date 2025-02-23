#!/usr/bin/env python3

from pathlib import Path
from dotenv import load_dotenv
import subprocess
import logging
import tempfile
import hashlib
import requests
import shutil
import time

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
env_serial_path = parent_dir / ".env.serial-number"

load_dotenv(current_dir / ".env")
load_dotenv(env_serial_path, override=True)

from config import settings
from src.frame_token import TokenManager
from config.logger import setup_logging

setup_logging(log_file_path=settings.UPDATE_LOGGING_FULL_FILE_PATH)
logger = logging.getLogger(__name__)

SERVICE_NAME = settings.SERVICE_NAME
INSTALL_DIR = Path(__file__).resolve().parent
BACKUP_DIR = INSTALL_DIR.parent / settings.UPDATE_BACKUP_DIR_NAME
VERSION_FILE = INSTALL_DIR / settings.UPDATE_VERSION_FILE_NAME

logger.info(f"Install directory: {INSTALL_DIR}")
logger.info(f"Backup directory: {BACKUP_DIR}")
logger.info(f"Version file: {VERSION_FILE}")


def get_current_version():
    """Read the current version from version file"""
    try:
        return VERSION_FILE.read_text().strip()
    except FileNotFoundError:
        logger.warning("Version file not found. Assuming initial installation.")
        return "0.0.0"


def get_latest_version_info():
    """Get information about the latest version from the API"""
    try:
        response = requests.get(
            settings.HTTP_UPDATE_LATEST_URL,
            headers=TokenManager.get_auth_headers(),
            timeout=600,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error checking for updates: {str(e)}")
        return None


def get_specific_version_info(version):
    """Get information about a specific version from the API"""
    try:
        response = requests.get(
            f"{settings.HTTP_BASE_URL}/{version}",
            headers=TokenManager.get_auth_headers(),
            timeout=600,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error getting version information: {str(e)}")
        return None


def download_update(version_info, temp_dir):
    """Download the update package"""
    update_file = Path(temp_dir) / "update.tar.gz"

    try:
        # Download update package
        logger.info(f"Downloading update from {version_info['download_url']}")
        response = requests.get(
            version_info["download_url"],
            headers=TokenManager.get_auth_headers(),
            stream=True,
            timeout=600,
        )
        response.raise_for_status()

        update_file.write_bytes(response.content)
        return update_file
    except Exception as e:
        logger.error(f"Error downloading update: {str(e)}")
        return None


def verify_update(update_file, version_info):
    """Verify the integrity of the downloaded update"""
    try:
        # Calculate SHA256 of the downloaded file
        sha256_hash = hashlib.sha256()
        sha256_hash.update(update_file.read_bytes())
        actual_checksum = sha256_hash.hexdigest()

        if actual_checksum != version_info["checksum"]:
            logger.error("Checksum verification failed!")
            logger.error(f"Expected: {version_info['checksum']}")
            logger.error(f"Actual: {actual_checksum}")
            return False

        logger.info("Checksum verification successful")
        return True
    except Exception as e:
        logger.error(f"Error verifying update: {str(e)}")
        return False


def backup_current_installation():
    """
    Create a backup of the current installation while properly handling special files.
    Skips named pipes and other special files while logging their exclusion.
    """
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    try:
        for old_backup in BACKUP_DIR.iterdir():
            if old_backup.is_dir():
                shutil.rmtree(old_backup)
                logger.info(f"Deleted old backup: {old_backup}")
    except Exception as e:
        logger.warning(f"Failed to delete old backups: {str(e)}")

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"shareframe_backup_{timestamp}"

    try:
        logger.info(f"Creating backup at {backup_path}")

        # Create the backup directory
        backup_path.mkdir(parents=True)

        # Custom copy function to handle special files
        def copy_with_special_handling(src, dst):
            try:
                if src.is_file():
                    shutil.copy2(src, dst)
                elif src.is_dir():
                    dst.mkdir(exist_ok=True)
                    for item in src.iterdir():
                        copy_with_special_handling(item, dst / item.name)
                else:
                    # Log special files that are being skipped
                    logger.warning(f"Skipping special file during backup: {src}")
            except Exception as e:
                logger.warning(f"Failed to copy {src}: {str(e)}")

        # Start the backup process
        for item in INSTALL_DIR.iterdir():
            # Skip the backup directory itself if it's a subdirectory
            if item.resolve() == BACKUP_DIR.resolve():
                continue

            try:
                copy_with_special_handling(item, backup_path / item.name)
            except Exception as e:
                logger.warning(f"Error while backing up {item}: {str(e)}")

        # Verify backup was created
        if not any(backup_path.iterdir()):
            raise Exception("Backup directory is empty")

        logger.info("Backup completed successful")
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


def install_update(update_file, version_info, temp_dir):
    """Extract and install the update by only replacing changed files"""
    extract_path = Path(temp_dir) / "extracted"

    try:
        # Extract the archive
        extract_path.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["tar", "-xzf", str(update_file), "-C", str(extract_path)],
            check=True,
            capture_output=True,
        )

        # Log extracted files for debugging
        extracted_files = list(extract_path.glob("**/*"))
        logger.info(f"Extracted contents: {extracted_files}")

        stop_service()

        # Ensure the installation directory exists
        if not INSTALL_DIR.exists():
            INSTALL_DIR.mkdir(parents=True, exist_ok=True)

        def update_files(src, dest):
            """Update files recursively, only replacing if different"""
            for item in src.glob("**/*"):
                relative_path = item.relative_to(src)
                dest_path = dest / relative_path

                # Handle directories
                if item.is_dir():
                    dest_path.mkdir(parents=True, exist_ok=True)
                    continue

                # Handle regular files
                if item.is_file():
                    # Check if file exists and is different
                    should_update = True
                    if dest_path.exists() and dest_path.is_file():
                        # Compare file contents
                        with open(item, "rb") as f1, open(dest_path, "rb") as f2:
                            should_update = f1.read() != f2.read()

                    if should_update:
                        logger.info(f"Updating file: {relative_path}")
                        # Ensure parent directory exists
                        dest_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(item, dest_path)
                    else:
                        logger.info(f"Skipping unchanged file: {relative_path}")

        logger.info("Starting selective file update")
        update_files(extract_path, INSTALL_DIR)

        # Log final installation contents for debugging
        final_files = list(INSTALL_DIR.glob("**/*"))
        logger.info(f"Final installation contents: {final_files}")

        # Update version file
        VERSION_FILE.write_text(version_info["version"])

        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {e.cmd}")
        logger.error(f"Output: {e.stdout}")
        logger.error(f"Error: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"Update installation failed: {str(e)}")
        return False


def stop_service():
    """Stopps the service"""
    try:
        logger.info(f"Stopping {SERVICE_NAME} service")
        subprocess.run(
            ["sudo", "systemctl", "stop", SERVICE_NAME],
            check=True,
            capture_output=True,
        )

        time.sleep(10)

        # Verify service is running
        result = subprocess.run(
            ["sudo", "systemctl", "is-active", SERVICE_NAME],
            capture_output=True,
            text=True,
        )
        if result.stdout.strip() == "inactive":
            logger.info(f"{SERVICE_NAME} service stopped successful")
            return True
        else:
            logger.error(f"{SERVICE_NAME} failed to stop properly")
            return False
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to stop service: {e.stderr}")
        return False


def restart_service():
    """Restart the service"""
    try:
        logger.info(f"Starting {SERVICE_NAME} service")
        subprocess.run(
            ["sudo", "systemctl", "start", SERVICE_NAME],
            check=True,
            capture_output=True,
        )

        time.sleep(10)

        # Verify service is running
        result = subprocess.run(
            ["sudo", "systemctl", "is-active", SERVICE_NAME],
            capture_output=True,
            text=True,
        )
        if result.stdout.strip() == "active":
            logger.info(f"{SERVICE_NAME} service started successful")
            return True
        else:
            logger.error(f"{SERVICE_NAME} failed to start properly")
            return False
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to start service: {e.stderr}")
        return False


def rollback_update(backup_path):
    """
    Rollback to the previous version while preserving special files from the current installation.
    Special files like named pipes are preserved rather than copied from backup.
    """
    try:
        logger.warning("Performing rollback to previous version")

        # Stop the service first
        stop_service()

        # Create a list of special files in current installation
        special_files = []
        for item in INSTALL_DIR.iterdir():
            if not item.is_file() and not item.is_dir():
                special_files.append((item.name, item.stat()))

        # Remove regular files and directories from current installation
        for item in INSTALL_DIR.iterdir():
            if item.is_file() or item.is_dir():
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()

        # Restore from backup, skipping any special files
        def restore_from_backup(src, dest):
            try:
                if src.is_file():
                    shutil.copy2(src, dest)
                elif src.is_dir():
                    dest.mkdir(exist_ok=True)
                    for item in src.iterdir():
                        restore_from_backup(item, dest / item.name)
            except Exception as e:
                logger.error(f"Failed to restore {src}: {str(e)}")
                raise

        for item in Path(backup_path).iterdir():
            # Skip if this is a special file in current installation
            if item.name not in [f[0] for f in special_files]:
                restore_from_backup(item, INSTALL_DIR / item.name)

        # Verify critical files were restored
        if not VERSION_FILE.exists():
            raise Exception("Critical files missing after rollback")

        # Restart the service
        if restart_service():
            logger.info("Rollback completed successful")
        else:
            raise Exception("Service failed to start after rollback")

    except Exception as e:
        logger.critical(f"Rollback failed: {str(e)}")
        logger.critical(
            "System may be in an inconsistent state. Manual intervention required."
        )

        # Try to restart service even if rollback failed
        try:
            restart_service()
        except Exception as restart_error:
            logger.critical(
                f"Failed to restart service after failed rollback: {str(restart_error)}"
            )


def is_special_file(path):
    """Check if a path points to a special file (not a regular file or directory)"""
    return path.exists() and not path.is_file() and not path.is_dir()


def main():
    """Main update process"""
    logger.info("Starting update process")

    # Get current version
    current_version = get_current_version()
    logger.info(f"Current version: {current_version}")

    # Check for new version
    latest_version_info = get_latest_version_info()
    if not latest_version_info:
        logger.error("Failed to get latest version information")
        return

    if latest_version_info["version"] == current_version:
        logger.info("Already running the latest version")
        return

    logger.info(
        f"New version {latest_version_info['version']} available. Starting update process."
    )

    # Create temporary directory for update files
    with tempfile.TemporaryDirectory() as temp_dir:
        # Download the update
        update_file = download_update(latest_version_info, temp_dir)
        if not update_file:
            logger.error("Failed to download update")
            return

        # Verify the update
        if not verify_update(update_file, latest_version_info):
            logger.error("Update verification failed")
            return

        # Backup current installation
        backup_path = backup_current_installation()
        if not backup_path:
            logger.error("Failed to create backup, aborting update")
            return

        # Install the update
        if install_update(update_file, latest_version_info, temp_dir):
            # Update succeeded, restart the service
            if restart_service():
                logger.info(
                    f"Update to version {latest_version_info['version']} completed successful"
                )
            else:
                logger.error("Service failed to restart after update")
                rollback_update(backup_path)
        else:
            logger.error("Update installation failed")
            rollback_update(backup_path)


if __name__ == "__main__":
    TokenManager.initialize()
    if not TokenManager.is_token_valid():
        success = TokenManager.obtain_token()
        if not success:
            logger.error("Failed to obtain token")
            raise Exception("Failed to obtain token")
    main()
