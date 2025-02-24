import logging
import subprocess

logger = logging.getLogger(__name__)


def clear_display():
    logger.info("Clearing display before update")

    try:
        result = subprocess.run(
            [
                "/home/frame/shareframe/.venv/bin/python",
                "/home/frame/shareframe/app/updates/clear_display.py",
            ],
            capture_output=True,
            text=True,
        )

        # Check if the subprocess exited with an error code
        if result.returncode != 0:
            logger.error(
                "Clearing display failed with exit code %d. Stderr: %s",
                result.returncode,
                result.stderr.strip(),
            )
            return False

        current_status = result.stdout.strip()
        logger.info(
            "Clearing display before update successful. Output: %s", current_status
        )
        return True

    except Exception as e:
        logger.error("Error clearing display: %s", str(e), exc_info=True)
        return False
