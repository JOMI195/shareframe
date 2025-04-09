import logging
from pathlib import Path

from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
env_serial_path = parent_dir / ".env.secrets"

load_dotenv(current_dir / ".env")
load_dotenv(env_serial_path, override=True)

import asyncio
import socket
from datetime import datetime
import requests
import backoff
from config import settings
from common.frame_token import TokenManager
from common.frame_auth_requests import frame_auth_token_request
from config.logger import setup_logging

# shareframe.de not ready for ipv6 yet
requests.packages.urllib3.util.connection.HAS_IPV6 = False

logger = logging.getLogger(__name__)


def get_local_ip_address():
    """Get the local IP address of the device."""
    try:
        # Create a socket to determine the outgoing IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # This doesn't need to be reachable
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        logger.error(f"Error getting local IP address: {e}")
        return None


@backoff.on_exception(
    backoff.expo,
    (requests.exceptions.RequestException, Exception),
    max_time=settings.HEARTBEAT_MAX_RETRY_DELAY_SECS,
)
async def send_heartbeat():
    """Send a heartbeat to the server with authentication."""
    try:
        local_ip = get_local_ip_address()
        if not local_ip:
            logger.warning("Could not get local IP address for heartbeat")
            return False

        payload = {"local_ip_address": local_ip, "version": settings.VERSION}

        logger.debug(f"Sending heartbeat with payload: {payload}")

        response = frame_auth_token_request(
            url=settings.HEARTBEAT_HTTP_FRAME_HEARTBEAT_URL,
            method="post",
            json=payload,
            timeout=600,
        )

        if response.status_code == 200:
            logger.info(f"Heartbeat sent successfully at {datetime.now()}")
            return True
        else:
            logger.error(
                f"Heartbeat failed with status code: {response.status_code}, response: {response.text}"
            )
            return False

    except Exception as e:
        logger.error(f"Error sending heartbeat: {e}")
        raise  # Let backoff handle the retry


async def heartbeat_task():
    """Continuous task to send heartbeats at regular intervals."""
    logger.info("Starting heartbeat main task")

    while True:
        try:
            await send_heartbeat()
        except Exception as e:
            logger.error(f"Heartbeat failed after all retries: {e}")
            raise

        await asyncio.sleep(settings.HEARTBEAT_HTTP_FRAME_HEARTBEAT_INTERVAL_MINS * 60)


if __name__ == "__main__":
    setup_logging(log_file_path=settings.HEARTBEAT_LOGGING_FULL_FILE_PATH)

    logger.info(f"Starting Hearbeat Application")

    TokenManager.initialize()

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(heartbeat_task())
    except Exception as e:
        logger.error(f"Running heartbeat application failed: {e}")
    finally:
        loop.close()
