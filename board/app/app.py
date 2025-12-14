import json
import os
from pathlib import Path
from typing import List
import asyncio
import signal
from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
env_serial_path = parent_dir / ".env.secrets"

load_dotenv(current_dir / ".env")
load_dotenv(env_serial_path, override=True)

from main.client import WebsocketClient
from main.image import ImageProcessor
from main.display import Display
from common.frame_token import TokenManager
from config import settings
from config.logger import setup_logging
import logging
import requests

# shareframe.de not ready for ipv6 yet
requests.packages.urllib3.util.connection.HAS_IPV6 = False


async def cancel_all_tasks():
    """Cancel all pending asyncio tasks."""
    logging.info("Clearing exisiting tasks")
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)


def _read_or_create_display_interval_file():
    """Read display interval from file or create with default value if not exists."""
    display_images_loop_interval_file = settings.DISPLAY_IMAGES_LOOP_INTERVAL_FILE_PATH
    default_interval = settings.IMAGES_LOOP_INTERVALL_MINUTES * 60

    if not display_images_loop_interval_file.exists():
        logging.info(
            f"Display images loop interval file {display_images_loop_interval_file} does not exist, creating default"
        )
        try:
            settings.SETTINGS_PERSIST_DIR_PATH.mkdir(parents=True, exist_ok=True)

            with open(display_images_loop_interval_file, "w") as f:
                json.dump({"interval_secs": default_interval}, f)
            return default_interval
        except Exception as e:
            logging.error(
                f"Error creating display images loop interval file: {e}", exc_info=True
            )
            return default_interval

    try:
        with open(display_images_loop_interval_file, "r") as f:
            control_data = json.load(f)

        stored_interval = control_data.get("interval_secs")
        if (
            stored_interval is not None
            and isinstance(stored_interval, (int, float))
            and stored_interval > 0
        ):
            logging.info(
                f"Loaded display images loop interval from file: {stored_interval} seconds"
            )
            return stored_interval
        else:
            logging.warning(
                f"Invalid interval value in control file: {stored_interval}, using default: {default_interval} seconds"
            )
            return default_interval
    except Exception as e:
        logging.error(
            f"Error reading display images loop interval file: {e}, using default: {default_interval} seconds",
            exc_info=True,
        )
        return default_interval


# Signal Handlers
def setup_signal_handlers(app):
    def handle_usr1_signal(signum, frame):
        logging.info("Received SIGUSR1 signal - skipping current image")
        asyncio.create_task(trigger_skip_image(app))

    def handle_usr2_signal(signum, frame):
        logging.info(
            "Received SIGUSR2 signal - checking for display images loop interval changes"
        )
        asyncio.create_task(check_display_images_loop_interval_change(app))

    signal.signal(signal.SIGUSR1, handle_usr1_signal)
    signal.signal(signal.SIGUSR2, handle_usr2_signal)
    logging.info("Signal handlers configured")


async def trigger_skip_image(app):
    app.display.skip_current_image()


async def check_display_images_loop_interval_change(app):
    """Check for interval changes in the control file and update if needed."""
    new_interval = _read_or_create_display_interval_file()

    if new_interval != app.display_interval:
        logging.info(
            f"Updating display images loop interval from {app.display_interval} to {new_interval} seconds"
        )
        await app.update_display_images_loop_interval(new_interval)
    else:
        logging.info(f"Display images loop interval unchanged: {new_interval} seconds")


# Application
class FrameApplication:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing main frame application")
        TokenManager.initialize()
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

        self.display_task = None
        self.display_interval = self._initialize_display_images_loop_interval()

        self.logger.info("Initializing main frame application successful")

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

    # Websocket handlers
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
            await self.display.clear_display_task()

    # Misc functions
    def _initialize_display_images_loop_interval(self):
        """Initialize display loop images interval from file or use default settings."""
        return _read_or_create_display_interval_file()

    async def update_display_images_loop_interval(self, new_interval_secs):
        """Update the display images loop interval and restart the display task."""
        self.display_interval = new_interval_secs

        if self.display_task and not self.display_task.done():
            self.logger.info("Cancelling existing display images loop task")
            self.display_task.cancel()
            try:
                await self.display_task
            except asyncio.CancelledError:
                self.logger.info(
                    "Previous display images loop task cancelled successfully"
                )

        self.display_task = asyncio.create_task(
            self.safe_task(
                self.display.display_images_in_loop_task(
                    interval_secs=self.display_interval
                ),
                "display_images_loop",
            )
        )
        self.logger.info(
            f"Display loop restarted with new interval: {self.display_interval} seconds"
        )

    async def safe_task(self, coro, name):
        try:
            await coro
        except asyncio.CancelledError:
            self.logger.info(f"Task {name} was cancelled")
        except Exception as e:
            self.logger.error(f"Task {name} failed: {e}", exc_info=True)

    # Main method
    async def run(self):
        self.logger.info("Starting main async methods")

        self.display_task = asyncio.create_task(
            self.safe_task(
                self.display.display_images_in_loop_task(
                    interval_secs=self.display_interval
                ),
                "display_images_loop",
            )
        )

        asyncio.create_task(
            self.safe_task(
                self.display.periodic_clear_display_task(),
                "clear_display_scheduler",
            )
        )

        try:
            await self.websocket_client.run()
        except Exception as e:
            self.logger.error(f"WebSocket client failed: {e}", exc_info=True)


# Entrypoint
async def main():
    logging.info("Starting main entrypoint")
    logging.info(
        f"Settings: Production={settings.PRODUCTION}, Debug={settings.DEBUG} , MOCK_DISPLAY={settings.MOCK_DISPLAY}"
    )

    try:
        await cancel_all_tasks()

        app = FrameApplication()
        setup_signal_handlers(app)

        await asyncio.wait_for(app.run(), timeout=None)
    except asyncio.CancelledError:
        logging.info("Main task was cancelled")
    except Exception as e:
        logging.error(f"Fatal error in main task: {e}", exc_info=True)
    finally:
        logging.info("Cleaning up before exit")
        await cancel_all_tasks()


if __name__ == "__main__":
    load_dotenv()
    setup_logging(log_file_path=settings.LOGGING_FULL_FILE_PATH)

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Program stopped by user")
    except Exception as e:
        logging.critical(f"Unhandled exception in asyncio.run: {e}", exc_info=True)
