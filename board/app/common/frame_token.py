import logging
import os
import requests
import json
from datetime import datetime, timezone
from .http_auth import HTTPAuth
from config import settings


class TokenManager:
    logger = logging.getLogger(__name__)
    token_cache_path = settings.FRAME_ACCESS_TOKEN_FILE_PATH

    logger.info("Initializing token manager")

    access_token = None
    token_expires_at = None

    @classmethod
    def initialize(cls):
        cls._load_cached_token()
        if not cls.verify_token():
            cls.obtain_token()

    @classmethod
    def _parse_timestamp(cls, timestamp_str):
        """Parse timestamp string with flexible format handling"""
        # Try different timestamp formats
        formats = [
            "%Y-%m-%dT%H:%M:%S.%fZ",  # With microseconds
            "%Y-%m-%dT%H:%M:%SZ",  # Without microseconds
            "%Y-%m-%dT%H:%M:%S.%f",  # With microseconds, no Z
            "%Y-%m-%dT%H:%M:%S",  # Without microseconds, no Z
        ]

        for fmt in formats:
            try:
                return datetime.strptime(timestamp_str, fmt).replace(
                    tzinfo=timezone.utc
                )
            except ValueError:
                continue

        # If none of the formats work, raise error
        raise ValueError(f"Unable to parse timestamp: {timestamp_str}")

    @classmethod
    def _load_cached_token(cls):
        cls.logger.info("Load cached access token")
        try:
            if cls.token_cache_path.exists():
                cached_token_data = json.loads(cls.token_cache_path.read_text())
                expires_at_str = cached_token_data.get(
                    "expires_at", "1970-01-01T00:00:00.000000Z"
                )
                expires_at = cls._parse_timestamp(expires_at_str)

                if datetime.now(timezone.utc) < expires_at:
                    cls.access_token = cached_token_data.get("access_token")
                    cls.token_expires_at = cached_token_data.get("expires_at")
                    cls.logger.info("Load cached access token successful")
                else:
                    cls.logger.info("Cached token has expired")
        except Exception as e:
            cls.logger.error(f"Error loading cached token: {str(e)}", exc_info=True)

    @classmethod
    def _save_cached_token(cls):
        cls.logger.info("Caching access token")
        try:
            os.makedirs(os.path.dirname(cls.token_cache_path.as_posix()), exist_ok=True)
            token_data = {
                "access_token": cls.access_token,
                "expires_at": cls.token_expires_at,
            }
            with open(cls.token_cache_path.as_posix(), "w") as f:
                json.dump(token_data, f)
            cls.logger.info("successful cached access token")
        except Exception as e:
            cls.logger.error(f"Error saving cached token: {str(e)}", exc_info=True)

    @classmethod
    def verify_token(cls) -> bool:
        if not cls.verify_token_expiry():
            return False
        cls.logger.info("Verifying access token with server")
        try:
            url = settings.HTTP_VERIFY_TOKEN_URL

            response = requests.post(
                url,
                json={"access_token": cls.access_token},
                timeout=600,
            )

            is_valid = response.status_code == 200

            cls.logger.info(f"Token verification result: {is_valid}")
            return is_valid
        except Exception as e:
            cls.logger.error(f"Token verification failed: {str(e)}", exc_info=True)
            return False

    @classmethod
    def verify_token_expiry(cls) -> bool:
        cls.logger.info("Verifying access token expiry")
        if not cls.access_token or not cls.token_expires_at:
            cls.logger.warning("Missing token or expiration time")
            return False
        try:
            expires_at = cls._parse_timestamp(cls.token_expires_at)
            is_valid = datetime.now(timezone.utc) < expires_at
            cls.logger.debug(f"Token has valid expiry: {is_valid}")
            return is_valid
        except ValueError as e:
            cls.logger.error(
                f"Error parsing token expiration time: {str(e)}", exc_info=True
            )
            return False

    @classmethod
    def obtain_token(cls) -> bool:
        cls.logger.info("Attempting to obtain new token")
        try:
            headers = HTTPAuth.get_http_auth_headers()
            url = settings.HTTP_OBTAIN_TOKEN_URL

            response = requests.post(
                url,
                json={},
                headers=headers,
                timeout=600,
            )

            response.raise_for_status()
            token_data = response.json()
            cls.access_token = token_data["access_token"]
            cls.token_expires_at = token_data["expires_at"]
            cls.logger.info(
                f"New token obtained successful. Expires at: {cls.token_expires_at}"
            )
            cls._save_cached_token()
            return True
        except Exception as e:
            cls.logger.error(f"Failed to obtain new token: {str(e)}", exc_info=True)
            return False

    @classmethod
    def get_auth_headers(cls):
        """Get the authentication headers for API requests"""
        return (
            {"Authorization": f"Frame-Access-Token {cls.access_token}"}
            if cls.access_token
            else {}
        )
