import asyncio
from datetime import datetime, timezone
import inspect
import os
import json
import logging
import requests
import websockets
from typing import List, Optional, Callable, Union
from config import settings


class WebsocketClient:
    def __init__(
        self,
        message_handlers: Optional[Union[Callable, List[Callable]]],
    ):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing WebSocket client")

        self.message_handlers = []
        if message_handlers is not None:
            if callable(message_handlers):
                self.message_handlers.append(message_handlers)
                self.logger.debug("Added single message handler")
            elif isinstance(message_handlers, list):
                self.message_handlers.extend(
                    handler for handler in message_handlers if callable(handler)
                )
                self.logger.debug(
                    f"Added {len(self.message_handlers)} message handlers"
                )

        if not self.message_handlers:
            self.message_handlers.append(self._default_message_handler)
            self.logger.info("Using default message handler")

        self.token_cache_file = settings.TOKEN_CACHE_FILE
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[float] = None
        self._load_cached_token()

    def _default_message_handler(self, message: dict):
        self.logger.info(f"Default handler received message: {message}")

    def _process_message(self, message: dict):
        self.logger.debug(f"Processing message: {message}")
        for handler in self.message_handlers:
            try:
                if inspect.iscoroutinefunction(handler):
                    asyncio.create_task(handler(message))
                else:
                    handler(message)
                self.logger.debug(
                    f"Handler {handler.__name__} processed message successfully"
                )
            except Exception as e:
                self.logger.error(
                    f"Error in message handler {handler.__name__}: {str(e)}",
                    exc_info=True,
                )

    def _load_cached_token(self):
        try:
            if os.path.exists(self.token_cache_file):
                with open(self.token_cache_file, "r") as f:
                    cached_token_data = json.load(f)
                expires_at = datetime.strptime(
                    cached_token_data.get("expires_at", "1970-01-01T00:00:00.000000Z"),
                    "%Y-%m-%dT%H:%M:%S.%fZ",
                ).replace(tzinfo=timezone.utc)

                if datetime.now(timezone.utc) < expires_at:
                    self.access_token = cached_token_data.get("access_token")
                    self.token_expires_at = cached_token_data.get("expires_at")
                    self.logger.info("Successfully loaded cached access token")
                else:
                    self.logger.info("Cached token has expired")
        except Exception as e:
            self.logger.error(f"Error loading cached token: {str(e)}", exc_info=True)

    def _save_cached_token(self):
        try:
            os.makedirs(os.path.dirname(self.token_cache_file), exist_ok=True)
            token_data = {
                "access_token": self.access_token,
                "expires_at": self.token_expires_at,
            }
            with open(self.token_cache_file, "w") as f:
                json.dump(token_data, f)
            self.logger.info("Successfully cached access token")
        except Exception as e:
            self.logger.error(f"Error saving cached token: {str(e)}", exc_info=True)

    def _verify_token(self) -> bool:
        if not self.access_token:
            self.logger.warning("No access token available for verification")
            return False

        try:
            response = requests.post(
                settings.HTTP_VERIFY_TOKEN_URL,
                json={"access_token": self.access_token},
                timeout=100,
            )
            is_valid = response.status_code == 200
            self.logger.info(f"Token verification result: {is_valid}")
            return is_valid
        except Exception as e:
            self.logger.error(f"Token verification failed: {str(e)}", exc_info=True)
            return False

    def _is_token_valid(self) -> bool:
        if not self.access_token or not self.token_expires_at:
            self.logger.warning("Missing token or expiration time")
            return False

        try:
            expires_at = datetime.strptime(
                self.token_expires_at, "%Y-%m-%dT%H:%M:%S.%fZ"
            ).replace(tzinfo=timezone.utc)
            is_valid = datetime.now(timezone.utc) < expires_at
            self.logger.debug(
                f"Token validity check: {is_valid}, expires at {expires_at}"
            )
            return is_valid
        except ValueError as e:
            self.logger.error(
                f"Error parsing token expiration time: {str(e)}", exc_info=True
            )
            return False

    def _obtain_token(self) -> bool:
        self.logger.info("Attempting to obtain new token")
        try:
            response = requests.post(
                settings.HTTP_OBTAIN_TOKEN_URL,
                data={"private_serial_number": settings.SERIAL_NUMBER},
                timeout=100,
            )
            response.raise_for_status()
            token_data = response.json()
            self.access_token = token_data["access_token"]
            self.token_expires_at = token_data["expires_at"]
            self.logger.info(
                f"New token obtained successfully. Expires at: {self.token_expires_at}"
            )
            self._save_cached_token()
            return True
        except Exception as e:
            self.logger.error(f"Failed to obtain new token: {str(e)}", exc_info=True)
            return False

    async def _connect_websocket(self) -> bool:
        if not self._is_token_valid():
            self.logger.info("Token invalid or expired, obtaining new token")
            if not self._obtain_token():
                return False

        url = settings.WS_FRAME_URL
        headers = {
            "Authorization": f"Frame-Access-Token {self.access_token}",
            "Origin": settings.WS_ORIGIN_URL,
        }

        try:
            self.logger.info(f"Establishing WebSocket connection to {url}")
            async with websockets.connect(url, additional_headers=headers) as websocket:
                self.logger.info("WebSocket connection established successfully")

                while True:
                    try:
                        message = await websocket.recv()
                        try:
                            parsed_message = json.loads(message)
                            self._process_message(parsed_message)
                        except json.JSONDecodeError:
                            self.logger.warning(f"Received non-JSON message: {message}")
                    except websockets.ConnectionClosed:
                        self.logger.warning("WebSocket connection closed")
                        return False

        except Exception as e:
            self.logger.error(f"WebSocket connection error: {str(e)}", exc_info=True)
            if not self._verify_token():
                self._obtain_token()
            return False

    async def run(self):
        self.logger.info("Starting WebSocket client")
        while True:
            await self._connect_websocket()
            self.logger.info("Reconnecting in 60 seconds...")
            await asyncio.sleep(60)
