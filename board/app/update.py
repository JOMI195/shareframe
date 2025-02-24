#!/usr/bin/env python3

from pathlib import Path
from dotenv import load_dotenv

CURRENT_DIR = Path(__file__).resolve().parent
ENV_SERIAL_PATH = CURRENT_DIR.parent / ".env.serial-number"

load_dotenv(CURRENT_DIR / ".env")
load_dotenv(ENV_SERIAL_PATH, override=True)

import logging
from src.frame_token import TokenManager
from config import settings
from config.logger import setup_logging
from updates.updates import UpdateManager
from updates.service import ServiceManager

setup_logging(log_file_path=settings.UPDATE_LOGGING_FULL_FILE_PATH)
logger = logging.getLogger(__name__)


def main():
    logger.info("Starting update process")

    TokenManager.initialize()
    if not TokenManager.is_token_expiry_valid():
        if not TokenManager.verify_token():
            success = TokenManager.obtain_token()
            if not success:
                logger.error("Failed to obtain token")
                raise Exception("Failed to obtain token")

    service_manager = ServiceManager(settings.SERVICE_NAME)
    update_manager = UpdateManager(
        service_manager=service_manager,
        install_dir=CURRENT_DIR,
        backup_dir=CURRENT_DIR.parent / settings.UPDATE_BACKUP_DIR_NAME,
        version_file_name=settings.UPDATE_VERSION_FILE_NAME,
        files_list_name=settings.UPDATE_FILES_LIST_NAME,
        files_to_delete_list_name=settings.UPDATE_DELETE_FILES_LIST_NAME,
        update_url=settings.HTTP_UPDATE_LATEST_URL,
        auth_headers=TokenManager.get_auth_headers(),
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
