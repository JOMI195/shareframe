import os
import sys
import time

libdir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "lib"
)
if os.path.exists(libdir):
    sys.path.append(libdir)

from waveshare_epd import epd7in5_V2

epd = epd7in5_V2.EPD()
epd.init()

print("Clearing display")
epd.Clear()
time.sleep(10)

print("Exiting")
epd.sleep()
epd7in5_V2.epdconfig.module_exit(cleanup=True)
