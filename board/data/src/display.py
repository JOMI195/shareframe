import asyncio
import os
import sys
import time
import logging
from PIL import Image
from datetime import datetime, timedelta, timezone
from config import settings

libdir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "lib"
)
if os.path.exists(libdir):
    sys.path.append(libdir)

from waveshare_epd import epd7in5_V2


class Display:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing display controller")

        try:
            self.epd = epd7in5_V2.EPD()
            self._initialize_display()

            self.last_refresh_time = datetime.now()
            self.current_image_path = None
            self.static_image_paths = []
            self.user_image_paths = []

            self._load_user_images()
            self._load_static_images()
            self.logger.info("Display controller initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize display: {str(e)}", exc_info=True)
            raise

    def _initialize_display(self):
        self.logger.info("Initializing e-paper display")
        try:
            self.epd.init()
            self.epd.Clear()
            self.last_refresh_time = datetime.now()
            time.sleep(2)
            self.epd.sleep()
            self.logger.info("E-paper display initialized and cleared")
        except Exception as e:
            self.logger.error(f"Display initialization failed: {str(e)}", exc_info=True)
            raise

    def _load_user_images(self):
        save_directory = settings.IMAGES_SAVE_DIR
        self.logger.info(f"Loading user images from: {save_directory}")

        if not os.path.exists(save_directory):
            self.logger.warning(f"User images directory not found: {save_directory}")
            return

        for filename in os.listdir(save_directory):
            filepath = os.path.join(save_directory, filename)
            if not os.path.isfile(filepath):
                continue

            try:
                parts = filename.split("_")
                if len(parts) < 4:
                    self.logger.info(
                        f"Skipping invalid filename {filepath}. Removing image"
                    )
                    os.remove(filepath)
                    continue

                sent_image_id = int(parts[-1].replace(".jpg", ""))
                expiry_timestamp = int(parts[-2])
                expiry_time = datetime.fromtimestamp(expiry_timestamp, tz=timezone.utc)

                if datetime.now(timezone.utc) > expiry_time:
                    self.logger.info(f"Removing expired image on init: {filepath}")
                    os.remove(filepath)
                    continue

                self.user_image_paths.append(
                    {
                        "path": filepath,
                        "expires_at": expiry_timestamp,
                        "sent_image_id": sent_image_id,
                    }
                )
                self.logger.info(f"Loaded user image: {filepath}")

            except Exception as e:
                self.logger.error(
                    f"Failed to process user image file: {filename}, Error: {str(e)}",
                    exc_info=True,
                )

        self.logger.info(f"Loaded {len(self.user_image_paths)} user images")

    def _load_static_images(self):
        static_folder = os.path.join(
            os.path.dirname(os.path.dirname(os.path.realpath(__file__))),
            settings.STATIC_IMAGES_DIR,
        )
        self.logger.info(f"Loading static images from: {static_folder}")

        if os.path.exists(static_folder):
            self.static_image_paths = [
                os.path.join(static_folder, f)
                for f in os.listdir(static_folder)
                if os.path.isfile(os.path.join(static_folder, f))
            ]
            self.logger.info(f"Loaded {len(self.static_image_paths)} static images")
        else:
            self.logger.warning(f"Static images directory not found: {static_folder}")

    def _can_refresh(self):
        now = datetime.now()
        interval_since_last_refresh = now - self.last_refresh_time
        time_until_next_refresh = timedelta(
            minutes=settings.NEXT_REFRESH_WAITING_INTERVALL_MINUTES
        )
        can_refresh = interval_since_last_refresh >= time_until_next_refresh
        self.logger.debug(
            f"Refresh check: interval={interval_since_last_refresh.total_seconds()}s, "
            f"required={time_until_next_refresh.total_seconds()}s, can_refresh={can_refresh}"
        )
        return can_refresh

    async def _wait_until_can_refresh(self):
        if not self._can_refresh():
            wait_time = (
                self.last_refresh_time
                + timedelta(minutes=settings.NEXT_REFRESH_WAITING_INTERVALL_MINUTES)
                - datetime.now()
            )
            self.logger.info(f"Waiting {wait_time.total_seconds()}s until next refresh")
        while not self._can_refresh():
            await asyncio.sleep(10)

    async def display_images_in_loop(self, interval: int):
        self.logger.info(f"Starting display loop with interval: {interval}s")

        while True:
            images_to_display = (
                self.user_image_paths
                if self.user_image_paths
                else self.static_image_paths
            )
            self.logger.debug(f"Current display queue: {len(images_to_display)} images")

            for image_data in list(images_to_display):
                if (
                    images_to_display == self.static_image_paths
                    and self.user_image_paths
                ):
                    self.logger.info(
                        "User images available while displaying static images, restarting display loop"
                    )
                    break

                image_path = (
                    image_data["path"] if isinstance(image_data, dict) else image_data
                )

                if not os.path.exists(image_path):
                    self.logger.warning(
                        f"Image path does not exist: {image_path}, skipping..."
                    )
                    continue

                expires_at = (
                    image_data.get("expires_at")
                    if isinstance(image_data, dict)
                    else None
                )

                if expires_at:
                    expires_at = datetime.fromtimestamp(
                        int(expires_at), tz=timezone.utc
                    )
                    if datetime.now(timezone.utc) > expires_at:
                        self.logger.info(f"Removing expired image: {image_path}")
                        self.user_image_paths.remove(image_data)
                        if os.path.exists(image_path):
                            try:
                                os.remove(image_path)
                                self.logger.debug(
                                    f"Deleted expired image file: {image_path}"
                                )
                            except OSError as e:
                                self.logger.error(
                                    f"Failed to delete expired image: {str(e)}"
                                )
                        continue

                await self._wait_until_can_refresh()
                await self._display_image(image_path)
                await asyncio.sleep(interval)

    async def _display_image(self, image_path: str):
        self.logger.info(f"Preparing to display image: {image_path}")

        try:
            await self._wait_until_can_refresh()
            self.epd.init_fast()

            image = Image.open(image_path)
            image = image.resize((self.epd.width, self.epd.height))
            self.epd.Clear()
            time.sleep(2)

            self.logger.debug("Sending image to display")
            self.epd.display(self.epd.getbuffer(image))

            self.epd.sleep()
            self.last_refresh_time = datetime.now()
            self.current_image_path = image_path
            self.logger.info("Image displayed successfully")

        except Exception as e:
            self.logger.error(f"Failed to display image: {str(e)}", exc_info=True)
            raise

    async def clear_display(self):
        self.logger.info("Clearing display")
        try:
            await self._wait_until_can_refresh()
            self.epd.init()
            self.epd.Clear()
            time.sleep(2)
            self.epd.sleep()
            self.last_refresh_time = datetime.now()
            self.logger.info("Display cleared successfully")
        except Exception as e:
            self.logger.error(f"Failed to clear display: {str(e)}", exc_info=True)
            raise
