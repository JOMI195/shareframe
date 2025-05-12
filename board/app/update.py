#!/usr/bin/env python3

import os
from pathlib import Path
from dotenv import load_dotenv

CURRENT_DIR = Path(__file__).resolve().parent
ENV_SERIAL_PATH = CURRENT_DIR.parent / ".env.secrets"

load_dotenv(CURRENT_DIR / ".env")
load_dotenv(ENV_SERIAL_PATH, override=True)

import logging
from config import settings
from config.logger import setup_logging
from updates.updates import UpdateManager
from service.service import ServiceManager
from common.frame_token import TokenManager
import requests

# shareframe.de not ready for ipv6 yet
requests.packages.urllib3.util.connection.HAS_IPV6 = False

setup_logging(log_file_path=settings.UPDATE_LOGGING_FULL_FILE_PATH)
logger = logging.getLogger(__name__)

force_all = os.getenv("FORCE_ALL_UPDATES", "false").lower() == "true"


def main():
    logger.info("Starting update process")

    TokenManager.initialize()

    application_service_manager = ServiceManager(settings.APPLICATION_SERVICE_NAME)
    dashboard_service_manager = ServiceManager(settings.DASHBOARD_SERVICE_NAME)
    heartbeat_service_manager = ServiceManager(settings.HEARTBEAT_SERVICE_NAME)

    update_manager = UpdateManager(
        application_service_manager=application_service_manager,
        dashboard_service_manager=dashboard_service_manager,
        heartbeat_service_manager=heartbeat_service_manager,
        install_dir=CURRENT_DIR,
        update_files_dir_name="update_files",
        backup_dir=CURRENT_DIR.parent / settings.UPDATE_BACKUP_DIR_NAME,
        files_to_backup_list_name=settings.UPDATE_FILES_LIST_NAME,
        files_to_delete_list_name=settings.UPDATE_DELETE_FILES_LIST_NAME,
        scripts_to_run_list_name=settings.SCRIPTS_TO_RUN_LIST_NAME,
        update_hash_secret_key=settings.UPDATE_HASH_SECRET_KEY,
        update_url=settings.HTTP_UPDATE_LATEST_URL,
        auth_headers=TokenManager.get_auth_headers(),
        version=settings.VERSION,
        criticalities_to_update_immediately=None if force_all else ["Critical"],
        backup_all=True,
        delete_all=True,
    )

    result = update_manager.check_and_apply_update()

    if result:
        logger.info("Update process completed successfully")
    else:
        logger.error("Update process failed")
        return 1

    return 0


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
