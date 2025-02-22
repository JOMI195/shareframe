import os
from pathlib import Path
from typing import List
import asyncio
from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
env_serial_path = parent_dir / ".env.serial-number"

load_dotenv(current_dir / ".env")
load_dotenv(env_serial_path, override=True)

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
                self.handle_websocket_clear_specific_images_message,
                self.handle_websocket_reset_frame_message,
            ],
            get_user_frame_images_info=self._get_user_frame_images_info,
            get_user_frame_images_ids_info=self._get_user_frame_images_ids_info,
        )

    def _get_user_frame_images_info(self) -> List[dict]:
        images = [
            {"sent_image_id": img["sent_image_id"], "expires_at": img["expires_at"]}
            for img in self.display.user_image_paths
            if isinstance(img, dict) and "sent_image_id" in img and "expires_at" in img
        ]
        return images

    def _get_user_frame_images_ids_info(self) -> List[str]:
        ids = [
            img["sent_image_id"]
            for img in self.display.user_image_paths
            if isinstance(img, dict) and "sent_image_id" in img
        ]
        return ids

    async def handle_websocket_picture_message(self, message: dict):
        if message.get("type") == "picture":
            sender = message.get("sender")
            sent_image_id = message.get("sent_image_id")

            self.logger.info(f"Image received from {sender}")

            # Check if sent_image_id already exists in self.display.user_image_paths
            for image_entry in self.display.user_image_paths:
                if image_entry.get("sent_image_id") == sent_image_id:
                    # Update expires_at if sent_image_id exists
                    image_entry["expires_at"] = message.get("expiry_unix_timestamp")
                    self.logger.info(
                        f"Updated expiry for image {sent_image_id} from {sender}"
                    )
                    return  # Exit early to avoid further processing

            # Process the image only if sent_image_id is not found
            saved_image_path = self.image_processor.process_image_message(message)
            expires_at = message.get("expiry_unix_timestamp")
            if saved_image_path:
                self.display.user_image_paths.insert(
                    0,
                    {
                        "path": saved_image_path,
                        "expires_at": expires_at,
                        "sent_image_id": sent_image_id,
                    },
                )

    async def handle_websocket_clear_specific_images_message(self, message: dict):
        if message.get("type") == "clear_specific_sent_images":
            sent_image_ids = message.get("sent_image_ids", [])
            self.logger.info(f"Clearing specific images with IDs: {sent_image_ids}")

            paths_to_remove = []
            updated_image_paths = []

            for image in self.display.user_image_paths:
                if (
                    isinstance(image, dict)
                    and image.get("sent_image_id") in sent_image_ids
                ):
                    paths_to_remove.append(image["path"])
                else:
                    updated_image_paths.append(image)

            self.display.user_image_paths = updated_image_paths

            for path in paths_to_remove:
                try:
                    os.remove(path)
                    self.logger.info(f"Removed file: {path}")
                except Exception as e:
                    self.logger.error(f"Failed to remove file {path}: {str(e)}")

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
    logging.info(f"Settings: Production={settings.PRODUCTION}, Debug={settings.DEBUG}")
    app = FrameApplication()
    await app.run()


if __name__ == "__main__":
    load_dotenv()
    asyncio.run(main())
