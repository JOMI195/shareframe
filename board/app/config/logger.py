import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from config import settings


def setup_logging(
    log_file_path: str,
    log_level: str = "INFO",
) -> None:
    log_dir = settings.LOGGING_SAVE_DIR

    Path(log_dir).mkdir(exist_ok=True)

    logger = logging.getLogger()
    logger.setLevel(log_level)

    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

    # File handler (rotating log files)
    file_handler = RotatingFileHandler(
        log_file_path, maxBytes=50 * 1024 * 1024, backupCount=0  # 50MB
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(log_level)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
