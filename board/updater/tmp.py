#!/usr/bin/env python3

import subprocess
import logging
import tempfile
import hashlib
import requests
import shutil
import time
from pathlib import Path

# Get the installation directory (two levels up from this script)
INSTALL_DIR = Path(__file__).resolve().parent.parent / "app"
BACKUP_DIR = INSTALL_DIR / "shareframe_backups"

# Configure logging
LOG_DIR = Path("/var/log/shareframe")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "shareframe-updater.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("shareframe-updater")

# Configuration
SERVICE_NAME = "shareframe"
API_BASE_URL = "http://localhost/api/frame-updates/"
VERSION_FILE = INSTALL_DIR / "version.txt"

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
        response = requests.get(f"{API_BASE_URL}/latest", timeout=600)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error checking for updates: {str(e)}")
        return None


def get_specific_version_info(version):
    """Get information about a specific version from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/{version}", timeout=600)
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
        response = requests.get(version_info["download_url"], stream=True, timeout=600)
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
    """Create a backup of the current installation"""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"shareframe_backup_{timestamp}"

    try:
        logger.info(f"Creating backup at {backup_path}")
        shutil.copytree(INSTALL_DIR, backup_path, symlinks=True)
        return backup_path
    except Exception as e:
        logger.error(f"Backup failed: {str(e)}")
        return None


def install_update(update_file, version_info, temp_dir):
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
        logger.info(f"Stopping {SERVICE_NAME} service")
        subprocess.run(
            ["systemctl", "stop", SERVICE_NAME], check=True, capture_output=True
        )

        # Install the update
        logger.info("Installing update")
        for item in extract_path.iterdir():
            dest = INSTALL_DIR / item.name
            if item.is_dir():
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(item, dest, symlinks=True)
            else:
                shutil.copy2(item, dest)

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


def restart_service():
    """Restart the service"""
    try:
        logger.info(f"Starting {SERVICE_NAME} service")
        subprocess.run(
            ["systemctl", "start", SERVICE_NAME], check=True, capture_output=True
        )

        # Verify service is running
        result = subprocess.run(
            ["systemctl", "is-active", SERVICE_NAME], capture_output=True, text=True
        )
        if result.stdout.strip() == "active":
            logger.info(f"{SERVICE_NAME} service started successfully")
            return True
        else:
            logger.error(f"{SERVICE_NAME} failed to start properly")
            return False
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to start service: {e.stderr}")
        return False


def rollback_update(backup_path):
    """Rollback to the previous version if update fails"""
    try:
        logger.warning("Performing rollback to previous version")

        # Stop the service first
        subprocess.run(
            ["systemctl", "stop", SERVICE_NAME], check=True, capture_output=True
        )

        # Remove the failed update
        for item in INSTALL_DIR.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()

        # Restore from backup
        for item in Path(backup_path).iterdir():
            dest = INSTALL_DIR / item.name
            if item.is_dir():
                shutil.copytree(item, dest, symlinks=True)
            else:
                shutil.copy2(item, dest)

        # Restart the service
        restart_service()
        logger.info("Rollback completed successfully")
    except Exception as e:
        logger.critical(f"Rollback failed: {str(e)}")
        logger.critical(
            "System may be in an inconsistent state. Manual intervention required."
        )


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
                    f"Update to version {latest_version_info['version']} completed successfully"
                )
            else:
                logger.error("Service failed to restart after update")
                rollback_update(backup_path)
        else:
            logger.error("Update installation failed")
            rollback_update(backup_path)


if __name__ == "__main__":
    main()
