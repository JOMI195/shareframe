import asyncio
from dataclasses import dataclass
from enum import Enum
import os
from pathlib import Path
import sys
import time
import logging
from typing import Optional
from PIL import Image
from datetime import datetime, timedelta, timezone
from config import settings

if not settings.MOCK_DISPLAY:
    libdir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "lib"
    )
    if os.path.exists(libdir):
        sys.path.append(libdir)

    from waveshare_epd import epd7in5_V2 as Driver


class EPDCommand(Enum):
    INIT = "init"
    CLEAR = "clear"
    DISPLAY_IMAGE = "display_image"


@dataclass
class EPDCommandParams:
    image_path: Optional[str] = None  # required for DISPLAY_IMAGE


class Display:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing display")

        self.skip_current_image_event = asyncio.Event()

        try:
            self.epd = None

            self._interact_with_display(EPDCommand.INIT)
            self._interact_with_display(EPDCommand.CLEAR)
            self._show_startup_image()

            self.last_refresh_time = datetime.now()
            self.current_image_path = None
            self.static_image_paths = []
            self.user_image_paths = []

            self._load_user_images()
            self._load_static_images()
            self.logger.info("Initializing display successful")
        except Exception as e:
            self.logger.error(f"Initializing display failed: {str(e)}", exc_info=True)
            raise

    def _interact_with_display(
        self,
        command: EPDCommand,
        params: Optional[EPDCommandParams] = None,
    ):
        self.logger.info(f"Executing command: {command.value}")
        try:
            if not settings.MOCK_DISPLAY:
                if command == EPDCommand.INIT:
                    self.epd = Driver.EPD()
                    self.logger.info("E-paper driver class initialized")
                    return

                self.epd.init()
                self.logger.info("E-paper display initialized (standard mode)")

                if command == EPDCommand.CLEAR:
                    self.epd.Clear()
                    self.logger.info("E-paper display cleared")
                elif command == EPDCommand.DISPLAY_IMAGE:
                    if not params or not params.image_path:
                        raise ValueError(
                            "DISPLAY_IMAGE command requires an image_path parameter"
                        )
                    current_pil_image = Image.open(params.image_path)
                    current_pil_image = current_pil_image.resize(
                        (self.epd.width, self.epd.height)
                    )
                    image_buffer = self.epd.getbuffer(current_pil_image)
                    self.epd.display(image_buffer)
                    current_pil_image.close()
                    self.logger.info("E-paper displayed image")
                else:
                    self.logger.warning(f"Unsupported command: {command}")
            else:
                self.logger.info(f"Simulating E-paper display command: {command}")
        except Exception as e:
            self.logger.error(
                f"Error during command {command}: {str(e)}", exc_info=True
            )
            raise
        finally:
            try:
                if not settings.MOCK_DISPLAY:
                    if command != EPDCommand.INIT:
                        self.epd.sleep()
                        self.logger.info("E-paper display put to sleep")
            except Exception as e:
                self.logger.error(
                    f"Error during command sleep: {str(e)}", exc_info=True
                )
                raise

    def _load_user_images(self):
        save_directory = settings.USER_IMAGES_SAVE_PATH.as_posix()

        self.logger.info(f"Loading user images from: {save_directory}")

        if not os.path.exists(save_directory):
            self.logger.warning(
                f"User images directory not found: {save_directory}. Creating directory instead."
            )
            Path(save_directory).mkdir()
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
        static_folder = settings.DEFAULT_IMAGES_PATH.as_posix()

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

    def _show_startup_image(self):
        self.logger.info(f"Displaying startup frame image")

        frame_startup_image_path = (
            settings.DEFAULT_FRAME_IMAGES_PATH / "logo-frame-loading-shareframe.jpg"
        ).as_posix()

        if os.path.exists(frame_startup_image_path):
            try:
                display_image_params = EPDCommandParams(frame_startup_image_path)
                self._interact_with_display(
                    EPDCommand.DISPLAY_IMAGE, display_image_params
                )

                self.last_refresh_time = datetime.now()
                self.logger.info(f"Displaying startup frame image successful")

            except Exception as e:
                self.logger.error(
                    f"Displaying startup frame image failed: {str(e)}", exc_info=True
                )
                raise
        else:
            self.logger.warning(
                f"Loading startup frame image not found: {frame_startup_image_path}"
            )

    def _can_refresh(self):
        now = datetime.now()
        interval_since_last_refresh = now - self.last_refresh_time
        time_until_next_refresh = timedelta(
            minutes=settings.NEXT_REFRESH_WAITING_INTERVALL_MINUTES
        )
        can_refresh = interval_since_last_refresh >= time_until_next_refresh
        self.logger.info(
            f"Refresh check: current-wait-time={interval_since_last_refresh.total_seconds()}s, "
            f"required-wait-time={time_until_next_refresh.total_seconds()}s until next refresh"
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

    async def _display_image(self, image_path: str):
        self.logger.info(f"Preparing to display image: {image_path}")

        try:
            await self._wait_until_can_refresh()

            display_image_params = EPDCommandParams(image_path)
            self._interact_with_display(EPDCommand.DISPLAY_IMAGE, display_image_params)

            self.last_refresh_time = datetime.now()
            self.current_image_path = image_path
            self.logger.info("Display of image successful")

        except Exception as e:
            self.logger.error(f"Failed to display image: {str(e)}", exc_info=True)
            raise

    # ------- TASKS
    async def clear_display_task(self):
        self.logger.info("Clearing display task")
        try:
            await self._wait_until_can_refresh()
            self._interact_with_display(command=EPDCommand.CLEAR)
            self.last_refresh_time = datetime.now()
            self.logger.info("Clearing display successful")
        except Exception as e:
            self.logger.error(f"Clearing display failed: {str(e)}", exc_info=True)
            raise

    async def display_images_in_loop_task(self, interval_secs: int):
        self.logger.info(f"Starting display loop with interval: {interval_secs}s")

        while True:
            images_to_display = (
                self.user_image_paths
                if self.user_image_paths
                else self.static_image_paths
            )
            self.logger.info(f"Current display queue: {len(images_to_display)} images")

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
                                self.logger.info(
                                    f"Deleted expired image file: {image_path}"
                                )
                            except OSError as e:
                                self.logger.error(
                                    f"Failed to delete expired image: {str(e)}"
                                )
                        continue

                await self._display_image(image_path)
                # await asyncio.sleep(interval_secs)

                self.skip_current_image_event.clear()  # Reset the event
                try:
                    # Wait for either the interval to pass or the skip event to be set
                    await asyncio.wait_for(
                        self.skip_current_image_event.wait(), timeout=interval_secs
                    )
                    if self.skip_current_image_event.is_set():
                        self.logger.info(
                            "Skipping sleep interval due to external trigger"
                        )
                except asyncio.TimeoutError:
                    # This is expected when the timeout is reached normally
                    pass

    def skip_current_image(self):
        self.logger.info("Skip current image requested")
        self.skip_current_image_event.set()

    async def periodic_clear_display_task(self, interval_secs: int):
        while True:
            await asyncio.sleep(interval_secs)
            self.logger.info("Clearing display in interval")
            await self.clear_display_task()
