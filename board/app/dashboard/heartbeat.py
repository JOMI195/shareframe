import asyncio
import logging
import socket
import time
from datetime import datetime
import requests
import backoff

from config import settings
from dashboard.frame_auth_requests import frame_auth_token_request

logger = logging.getLogger(__name__)

HEARTBEAT_INTERVAL_SECS = settings.DASHBOARD_HTTP_FRAME_HEARTBEAT_INTERVAL_MINS * 60
MAX_RETRY_DELAY = 10 * 60  # Maximum retry delay of 10 minutes
HEARTBEAT_URL = settings.DASHBOARD_HTTP_FRAME_HEARTBEAT_URL


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
    max_time=MAX_RETRY_DELAY,
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
            url=HEARTBEAT_URL, method="post", json=payload, timeout=600
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
    logger.info("Starting heartbeat task")

    while True:
        try:
            await send_heartbeat()
        except Exception as e:
            logger.error(f"Heartbeat failed after all retries: {e}")

        # Wait for the next interval
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECS)


def start_heartbeat_service():
    """Start the heartbeat service in the background."""
    loop = asyncio.get_event_loop()
    task = loop.create_task(heartbeat_task())
    return task


# If this file is run directly, start the heartbeat service
if __name__ == "__main__":
    from config.logger import setup_logging

    setup_logging(log_file_path=settings.DASHBOARD_LOGGING_FULL_FILE_PATH)

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(heartbeat_task())
    except KeyboardInterrupt:
        logger.info("Heartbeat service stopped by user")
    finally:
        loop.close()
