import asyncio
import inspect
import json
import logging
import ssl
import time
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
                self.logger.info("Added single message handler")
            elif isinstance(message_handlers, list):
                self.message_handlers.extend(
                    handler for handler in message_handlers if callable(handler)
                )
                self.logger.info(f"Added {len(self.message_handlers)} message handlers")

        if not self.message_handlers:
            self.message_handlers.append(self._default_message_handler)
            self.logger.info("Using default message handler")

        self._status_check_task: Optional[asyncio.Task] = None
        self._ping_task: Optional[asyncio.Task] = None
        self._last_pong_time = time.time()

        self.logger.info("Initializing websocket client successful")

    # ------- MESSAGE-HANDLERS
    def _default_message_handler(self, message: dict):
        self.logger.info(f"Default handler received message: {message}")

    # ------- PROCESSING MESSAGES
    def _process_message(self, message: dict):
        self.logger.info(f"Processing message: {message}")

        # Handle pong message
        if message.get("type") == "pong":
            self._last_pong_time = time.time()
            self.logger.info(f"Received pong response at {self._last_pong_time}")
            return

        # Process other messages with handlers
        for handler in self.message_handlers:
            try:
                if inspect.iscoroutinefunction(handler):
                    asyncio.create_task(handler(message))
                else:
                    handler(message)
                self.logger.info(
                    f"Handler {handler.__name__} processed message successful"
                )
            except Exception as e:
                self.logger.error(
                    f"Error in message handler {handler.__name__}: {str(e)}",
                    exc_info=True,
                )

    # async def cancel_status_check_task(self):
    #     if self._status_check_task:
    #         try:
    #             if not self._status_check_task.done():
    #                 self.logger.info("Cancelling existing status check task")
    #                 self._status_check_task.cancel()
    #                 try:
    #                     await self._status_check_task
    #                 except asyncio.CancelledError:
    #                     pass
    #         except Exception as e:
    #             self.logger.error(f"Error during task cancellation: {e}")
    #         finally:
    #             self._status_check_task = None

    # async def cancel_ping_task(self):
    #     if self._ping_task:
    #         try:
    #             if not self._ping_task.done():
    #                 self.logger.info("Cancelling existing ping task")
    #                 self._ping_task.cancel()
    #                 try:
    #                     await self._ping_task
    #                 except asyncio.CancelledError:
    #                     pass
    #         except Exception as e:
    #             self.logger.error(f"Error during ping task cancellation: {e}")
    #         finally:
    #             self._ping_task = None

    # ------- TASKS
    async def _periodic_status_check_task(self, websocket):
        try:
            while True:
                if websocket:
                    await self._check_user_frame_images_expiry(websocket)
                    await self._check_user_frame_missing_images(websocket)
                    await asyncio.sleep(
                        settings.IMAGES_STATUS_CHECK_INTERVAL_MINUTES * 60
                    )
                else:
                    break
        except websockets.exceptions.ConnectionClosed as e:
            self.logger.info(
                f"WebSocket connection closed: {e}, stopping periodic status check"
            )

    async def _periodic_ping_task(self, websocket):
        """Send periodic pings to the server to keep the connection alive"""
        try:
            while True:
                if websocket:
                    # Send ping
                    ping_message = {"type": "ping", "timestamp": time.time()}
                    await websocket.send(json.dumps(ping_message))
                    self.logger.info(f"Sent ping at {time.time()}")

                    # Wait for pong timeout
                    await asyncio.sleep(settings.WEBSOCKET_PONG_TIMEOUT)

                    # Check if pong was received
                    if (
                        time.time() - self._last_pong_time
                        > settings.WEBSOCKET_PONG_TIMEOUT
                    ):
                        self.logger.warning(
                            "Pong timeout detected, connection may be dead"
                        )
                        raise websockets.exceptions.ConnectionClosed(
                            1000, "Pong timeout - no response to ping"
                        )

                    # Wait until next ping interval
                    await asyncio.sleep(
                        settings.WEBSOCKET_PING_INTERVAL
                        - settings.WEBSOCKET_PONG_TIMEOUT
                    )
                else:
                    break
        except websockets.exceptions.ConnectionClosed as e:
            self.logger.info(f"WebSocket connection closed during ping: {e}")
            raise  # Re-raise to signal the connection is closed

    async def _cancel_websocket_tasks(self):
        tasks_to_cancel = [
            task
            for task in [self._status_check_task, self._ping_task]
            if task is not None and not task.done()
        ]

        if tasks_to_cancel:
            self.logger.info(f"Cancelling {len(tasks_to_cancel)} background tasks")
            for task in tasks_to_cancel:
                try:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                except Exception as e:
                    self.logger.error(f"Error cancelling task: {e}")

        self._status_check_task = None
        self._ping_task = None

    async def _check_user_frame_images_expiry(self, websocket):
        try:
            if websocket:
                user_frame_images = self.get_user_frame_images_info()

                self.logger.info(
                    f"#1 - Asking for status check for {len(user_frame_images)} images: {str(user_frame_images)}"
                )

                status_message = {
                    "type": "check_sent_images_expiry",
                    "user_frame_images": user_frame_images,
                }

                await websocket.send(json.dumps(status_message), text=True)
                self.logger.info(f"#1 - Asking for status check done")

        except Exception as e:
            self.logger.error(
                f"Error asking for images status check: {str(e)}",
                exc_info=True,
            )

    async def _check_user_frame_missing_images(self, websocket):
        try:
            if websocket:
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

    # ------- CONNECTION
    async def _connect_websocket(self) -> bool:
        if not TokenManager.is_token_expiry_valid():
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

                await self._cancel_websocket_tasks()
                self._last_pong_time = time.time()  # Reset pong time on new connection

                # Start status check task
                async def bounded_status_check():
                    try:
                        await self._periodic_status_check_task(websocket)
                    except Exception as e:
                        self.logger.error(f"Status check task failed: {e}")

                self._status_check_task = asyncio.create_task(bounded_status_check())

                # Start ping task
                async def bounded_ping():
                    try:
                        await self._periodic_ping_task(websocket)
                    except Exception as e:
                        self.logger.error(f"Ping task failed: {e}")
                        # Force reconnection if ping fails
                        return False

                self._ping_task = asyncio.create_task(bounded_ping())

                try:
                    while True:
                        try:
                            message = await asyncio.wait_for(
                                websocket.recv(),
                                timeout=settings.WEBSOCKET_RECV_TIMEOUT,
                            )
                            try:
                                parsed_message = json.loads(message)
                                self._process_message(parsed_message)
                            except json.JSONDecodeError:
                                self.logger.warning(
                                    f"Received non-JSON message: {message}"
                                )
                        except asyncio.TimeoutError:
                            self.logger.warning(
                                f"WebSocket recv timeout after {settings.WEBSOCKET_RECV_TIMEOUT} seconds"
                            )
                            # We don't need to ping here since we have a dedicated ping task
                        except websockets.ConnectionClosed as e:
                            self.logger.warning(f"WebSocket connection closed: {e}")
                            await self._cancel_websocket_tasks()
                            return False
                finally:
                    self.logger.info("Ending websocket session, cleaning up tasks")
                    await self._cancel_websocket_tasks()

        except Exception as e:
            self.logger.error(f"WebSocket connection error: {str(e)}", exc_info=True)
            if not TokenManager.verify_token():
                TokenManager.obtain_token()

            await self._cancel_websocket_tasks()
            return False

    # ------- MAIN
    async def run(self):
        self.logger.info("Starting websocket client main method")
        while True:
            try:
                await self._connect_websocket()
            except Exception as e:
                self.logger.error(f"Unexpected error in websocket run: {e}")

            await self._cancel_websocket_tasks()

            self.logger.info("Reconnecting in 60 seconds...")
            await asyncio.sleep(60)
