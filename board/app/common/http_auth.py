import hashlib
import hmac
import logging
import os
import time
from config import settings

logger = logging.getLogger(__name__)


class HTTPAuth:

    def generate_http_auth_hash(private_serial_number, timestamp):
        """
        Generate the authorization hash using the same algorithm as the server.
        """

        logger.info(
            "Generating new Auth-Hash for Authorization with shareframe http servers"
        )

        message = f"{private_serial_number}:{timestamp}".encode()

        digest = hmac.new(
            settings.FRAME_AUTH_SECRET_KEY.encode(), message, digestmod=hashlib.sha256
        ).hexdigest()

        logger.info("New Auth-Hash generated successful")

        return digest

    def get_http_auth_headers():
        """Get the authentication headers for http API requests"""
        timestamp = str(int(time.time()))

        serial_number = os.getenv("SERIAL_NUMBER")

        if serial_number == None:
            raise Exception("serial_number not found in env")

        auth_hash = HTTPAuth.generate_http_auth_hash(serial_number, timestamp)

        headers = {
            "Authorization": f"Auth-Hash {auth_hash}",
            "X-Timestamp": timestamp,
            "Content-Type": "application/json",
        }

        return headers
