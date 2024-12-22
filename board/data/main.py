from dotenv import load_dotenv

load_dotenv()

import asyncio
from src.client import WebsocketClient
from src.image import ImageProcessor
from src.display import Display
from config import settings
from config.logger import setup_logging
import logging


class FrameApplication:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.image_processor = ImageProcessor()
        self.display = Display()
        self.websocket_client = WebsocketClient(
            message_handlers=[
                self.handle_websocket_picture_message,
                self.handle_websocket_reset_frame_message,
            ],
        )

    async def handle_websocket_picture_message(self, message: dict):
        if message.get("type") == "picture":
            sender = message.get("sender")
            self.logger.info(f"Image recieved from {sender}")
            saved_image_path = self.image_processor.process_image_message(message)
            expires_at = message.get("expiry_unix_timestamp")
            if saved_image_path:
                self.display.user_image_paths.append(
                    {"path": saved_image_path, "expires_at": expires_at}
                )

    async def handle_websocket_reset_frame_message(self, message: dict):
        if message.get("type") == "clear_display":
            await self.display.clear_display()

    async def run(self):
        asyncio.create_task(
            self.display.display_images_in_loop(
                interval=settings.IMAGES_LOOP_INTERVALL_MINUTES * 60
            )
        )
        # asyncio.create_task(self.display.refresh_if_needed())
        await self.websocket_client.run()


async def main():
    setup_logging()
    logging.info("Starting application")
    app = FrameApplication()
    await app.run()


if __name__ == "__main__":
    load_dotenv()
    asyncio.run(main())
