import asyncio
import os
import sys
import time
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
        self.epd = epd7in5_V2.EPD()
        self._initialize_display()

        self.last_refresh_time = datetime.now()
        self.current_image_path = None

        self.static_image_paths = []
        self.user_image_paths = []
        self._load_static_images()

    def _initialize_display(self):
        self.epd.init()
        self.epd.Clear()
        self.last_refresh_time = datetime.now()
        time.sleep(2)
        self.epd.sleep()

    def _load_static_images(self):
        static_folder = os.path.join(
            os.path.dirname(os.path.dirname(os.path.realpath(__file__))),
            settings.STATIC_IMAGES_DIR,
        )
        print(f"static folder path: {static_folder}")
        if os.path.exists(static_folder):
            self.static_image_paths = [
                os.path.join(static_folder, f)
                for f in os.listdir(static_folder)
                if os.path.isfile(os.path.join(static_folder, f))
            ]
            print(f"{len(self.static_image_paths)} static images loaded")

    def _can_refresh(self):
        now = datetime.now()
        interval_since_last_refresh = now - self.last_refresh_time
        time_until_next_refresh = timedelta(
            minutes=settings.NEXT_REFRESH_WAITING_INTERVALL_MINUTES
        )
        return interval_since_last_refresh >= time_until_next_refresh

    async def _wait_until_can_refresh(self):
        while not self._can_refresh():
            await asyncio.sleep(10)

    async def display_images_in_loop(self, interval: int):
        print("starting displaying images in a loop")
        while True:
            images_to_display = (
                self.user_image_paths
                if self.user_image_paths
                else self.static_image_paths
            )

            print(f"images to display in loop {len(images_to_display)}")

            for image_data in list(images_to_display):

                if (
                    images_to_display == self.static_image_paths
                    and self.user_image_paths
                ):
                    print("User images available, restarting display loop")
                    break

                print(f"display image data: {image_data}")
                image_path = (
                    image_data["path"] if isinstance(image_data, dict) else image_data
                )
                expires_at = (
                    image_data.get("expires_at")
                    if isinstance(image_data, dict)
                    else None
                )

                if expires_at:
                    expires_at = datetime.fromtimestamp(
                        int(expires_at), tz=timezone.utc
                    )

                if expires_at and datetime.now().timestamp() > expires_at:
                    self.user_image_paths.remove(image_data)
                    if os.path.exists(image_path):
                        os.remove(image_path)
                    continue

                await self._wait_until_can_refresh()
                await self.display_image(image_path)

                await asyncio.sleep(interval)

    async def display_image(self, image_path: str):
        await self._wait_until_can_refresh()
        self.epd.init_fast()
        image = Image.open(image_path)
        image = image.resize((self.epd.width, self.epd.height))
        self.epd.Clear()
        print(f"displaying {image_path}")
        self.epd.display(self.epd.getbuffer(image))
        time.sleep(60)
        self.epd.sleep()

        self.last_refresh_time = datetime.now()
        self.current_image_path = image_path

    async def clear_display(self):
        await self._wait_until_can_refresh()
        self.epd.init()
        print("clearing display")
        self.epd.Clear()
        time.sleep(10)
        self.epd.sleep()
        self.last_refresh_time = datetime.now()

    # async def refresh_if_needed(self):
    #     while True:
    #         if self.current_image_path:
    #             now = datetime.now()
    #             if now - self.last_refresh_time >= timedelta(
    #                 hours=settings.REFRESH_INTERVAL_HOURS
    #             ):
    #                 self.display_image(self.current_image_path)
    #         await asyncio.sleep(3600)  # Check every hour
