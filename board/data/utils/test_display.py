import os
import sys
import time
from PIL import Image
from config.settings import DisplayConfig

libdir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "lib"
)
if os.path.exists(libdir):
    sys.path.append(libdir)

from waveshare_epd import epd7in5_V2

epd = epd7in5_V2.EPD()
epd.init()
epd.Clear()
time.sleep(2)

static_folder = os.path.join(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))),
    DisplayConfig.STATIC_IMAGES_SAVE_DIR,
)
print(f"static folder path: {static_folder}")

if os.path.exists(static_folder):
    image_files = [
        f
        for f in os.listdir(static_folder)
        if os.path.isfile(os.path.join(static_folder, f))
    ]

    if image_files:
        image_path = os.path.join(static_folder, image_files[0])
        print(f"Loading image: {image_path}")

        image = Image.open(image_path)
        image = image.resize((epd.width, epd.height))

        print(f"Displaying {image_path}")
        epd.display(epd.getbuffer(image))

        time.sleep(60)

        print("Clearing display again")
        epd.Clear()
        time.sleep(60)
    else:
        print("No images found in the static folder")
else:
    print(f"Static folder not found: {static_folder}")

print("Exiting")
epd.sleep()
epd7in5_V2.epdconfig.module_exit(cleanup=True)
