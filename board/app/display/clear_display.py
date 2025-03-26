#!/usr/bin/env python3
import os
import sys
import traceback

# Adjust the library directory if it exists
libdir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "lib"
)
if os.path.exists(libdir):
    sys.path.append(libdir)


def clear_display():
    try:
        from waveshare_epd import epd7in5_V2

        epd = epd7in5_V2.EPD()
        epd.init()
        epd.Clear()
        epd.sleep()

        epd7in5_V2.epdconfig.module_exit(cleanup=True)

        print("Display cleared successfully")
        sys.stdout.flush()
        return True
    except Exception as e:
        print("Error clearing display:", e, file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        return False


if __name__ == "__main__":
    if clear_display():
        sys.exit(0)
    else:
        sys.exit(1)
