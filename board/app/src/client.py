import asyncio
import inspect
import json
import logging
import ssl
import certifi
import websockets
from typing import List, Optional, Callable, Union
from config import settings
from src.frame_token import TokenManager


class WebsocketClient:
    def __init__(
        self,
        message_handlers: Optional[Union[Callable, List[Callable]]],
        get_user_frame_images_info: Optional[Callable[[], List[dict]]] = None,
        get_user_frame_images_ids_info: Optional[Callable[[], List[dict]]] = None,
    ):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing websocket client")

        self.get_user_frame_images_info = get_user_frame_images_info or (lambda: {})
        self.get_user_frame_images_ids_info = get_user_frame_images_ids_info or (
            lambda: []
        )
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

        self._status_check_task: Optional[asyncio.Task] = None

        self.logger.info("Initializing websocket client successful")

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
                    f"Handler {handler.__name__} processed message successful"
                )
            except Exception as e:
                self.logger.error(
                    f"Error in message handler {handler.__name__}: {str(e)}",
                    exc_info=True,
                )

    def _cancel_status_check_task(self):
        if self._status_check_task and not self._status_check_task.done():
            self.logger.debug("Cancelling existing status check task")
            self._status_check_task.cancel()

    async def _periodic_status_check(self, websocket):
        try:
            while True:
                await self._check_user_frame_images_expiry(websocket)
                await self._check_user_frame_missing_images(websocket)
                await asyncio.sleep(settings.IMAGES_STATUS_CHECK_INTERVAL_MINUTES * 60)
        except websockets.exceptions.ConnectionClosed as e:
            self.logger.info(
                f"WebSocket connection closed: {e}, stopping periodic status check"
            )

    async def _check_user_frame_images_expiry(self, websocket):
        try:
            user_frame_images = self.get_user_frame_images_info()

            self.logger.info(
                f"#1 - Asking for status check for {len(user_frame_images)} images: {str(user_frame_images)}"
            )

            status_message = {
                "type": "check_sent_images_expiry",
                "user_frame_images": user_frame_images,
            }

            await websocket.send(json.dumps(status_message), text=True)
            self.logger.info(f"#1 - Asking Asking for status check done")

        except Exception as e:
            self.logger.error(
                f"Error asking for images status check: {str(e)}",
                exc_info=True,
            )

    async def _check_user_frame_missing_images(self, websocket):
        try:
            user_frame_images = self.get_user_frame_images_ids_info()

            self.logger.info(
                f"#2 - Asking for missing images check for {len(user_frame_images)} images: {user_frame_images}"
            )

            status_message = {
                "type": "check_mssing_images",
                "sent_image_ids": user_frame_images,
            }

            await websocket.send(json.dumps(status_message), text=True)
            self.logger.info(f"#2 - Asking for missing images check done")

        except Exception as e:
            self.logger.error(
                f"Error asking for images status check: {str(e)}",
                exc_info=True,
            )

    async def _connect_websocket(self) -> bool:
        if not TokenManager.is_token_valid():
            self.logger.info("Token invalid or expired, obtaining new token")
            if not TokenManager.obtain_token():
                return False

        url = settings.WS_FRAME_URL
        headers = TokenManager.get_auth_headers()
        headers["Origin"] = settings.WS_ORIGIN_URL
        ssl_context = None
        if settings.PRODUCTION:
            ssl_context = ssl.create_default_context()
            ssl_context.load_verify_locations(certifi.where())

        try:
            self.logger.info(f"Establishing WebSocket connection to {url}")
            async with websockets.connect(
                url,
                additional_headers=headers,
                open_timeout=900,
                ssl=ssl_context if settings.PRODUCTION == True else None,
                max_size=settings.WEBSOCKET_MESSAGE_MAX_SIZE,
            ) as websocket:
                self.logger.info("WebSocket connection established successful")

                self._cancel_status_check_task()
                self._status_check_task = asyncio.create_task(
                    self._periodic_status_check(websocket)
                )

                while True:
                    try:
                        message = await websocket.recv()
                        try:
                            parsed_message = json.loads(message)
                            self._process_message(parsed_message)
                        except json.JSONDecodeError:
                            self.logger.warning(f"Received non-JSON message: {message}")
                    except websockets.ConnectionClosed as e:
                        self.logger.warning(f"WebSocket connection closed: {e}")
                        return False

        except Exception as e:
            self.logger.error(f"WebSocket connection error: {str(e)}", exc_info=True)
            if not TokenManager.verify_token():
                TokenManager.obtain_token()
            return False

    async def run(self):
        self.logger.info("Starting websocket client main method")
        while True:
            await self._connect_websocket()
            self.logger.info("Reconnecting in 60 seconds...")
            await asyncio.sleep(60)
