import asyncio
from datetime import datetime, timezone
import inspect
import os
import json
import requests
import websockets
from typing import List, Optional, Callable, Union
from config import settings


class WebsocketClient:
    def __init__(
        self,
        message_handlers: Optional[Union[Callable, List[Callable]]],
    ):
        self.message_handlers = []
        if message_handlers is not None:
            if callable(message_handlers):
                self.message_handlers.append(message_handlers)
            elif isinstance(message_handlers, list):
                self.message_handlers.extend(
                    handler for handler in message_handlers if callable(handler)
                )
        if not self.message_handlers:
            self.message_handlers.append(self._default_message_handler)

        self.token_cache_file = settings.TOKEN_CACHE_FILE
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[float] = None
        self._load_cached_token()

    def _default_message_handler(self, message: dict):
        print(f"Received message: {message}")

    def _process_message(self, message: dict):
        for handler in self.message_handlers:
            try:
                if inspect.iscoroutinefunction(handler):
                    asyncio.create_task(handler(message))
                else:
                    handler(message)
            except Exception as e:
                print(f"Error in message handler {handler}: {e}")

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
                    print("Loaded cached access token")
        except Exception as e:
            print(f"Error loading cached token: {e}")

    def _save_cached_token(self):
        try:
            os.makedirs(os.path.dirname(self.token_cache_file), exist_ok=True)

            token_data = {
                "access_token": self.access_token,
                "expires_at": self.token_expires_at,
            }
            with open(self.token_cache_file, "w") as f:
                json.dump(token_data, f)
            print("Cached access token saved")
        except Exception as e:
            print(f"Error saving cached token: {e}")

    def _verify_token(self) -> bool:
        if not self.access_token:
            return False
        try:
            response = requests.post(
                settings.HTTP_VERIFY_TOKEN_URL,
                json={"access_token": self.access_token},
                timeout=100,
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Token verification error: {e}")
            return False

    def _is_token_valid(self) -> bool:
        if not self.access_token or not self.token_expires_at:
            return False

        try:
            expires_at = datetime.strptime(
                self.token_expires_at, "%Y-%m-%dT%H:%M:%S.%fZ"
            ).replace(tzinfo=timezone.utc)

            return datetime.now(timezone.utc) < expires_at
        except ValueError as e:
            print(f"Error parsing token expiration time: {e}")
            return False

    def _obtain_token(self) -> bool:
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

            print(f"New token obtained. Expires at: {self.token_expires_at}")

            self._save_cached_token()

            return True
        except Exception as e:
            print(f"Failed to obtain a valid token: {e}")
            return False

    async def _connect_websocket(self) -> bool:
        if not self._is_token_valid():
            if not self._obtain_token():
                return False

        url = settings.WS_FRAME_URL
        headers = {
            "Authorization": f"Frame-Access-Token {self.access_token}",
            "Origin": settings.WS_ORIGIN_URL,
        }

        try:
            async with websockets.connect(url, additional_headers=headers) as websocket:
                print("WebSocket connection established")
                while True:
                    try:
                        message = await websocket.recv()
                        try:
                            parsed_message = json.loads(message)
                            self._process_message(parsed_message)
                        except json.JSONDecodeError:
                            print(f"Received non-JSON message: {message}")
                    except websockets.ConnectionClosed:
                        print("WebSocket connection closed")
                        return False
        except Exception as e:
            print(f"WebSocket connection error: {e}")
            if not self._verify_token():
                self._obtain_token()
            return False

    async def run(self):
        while True:
            await self._connect_websocket()
            await asyncio.sleep(60)
