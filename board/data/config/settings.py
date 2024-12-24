import os

DEBUG = os.getenv("DEBUG", False) == "True"
PRODUCTION = os.getenv("PRODUCTION", False) == "True"

# Logging config
LOGGING_SAVE_DIR = "logs"
LOGGING_FILE = "frame_logs.log"
LOGGING_FULL_FILE_PATH = f"{LOGGING_SAVE_DIR}/{LOGGING_FILE}"

# Client config
BASE_URL = os.getenv("BASE_URL")

if PRODUCTION == True:
    HTTP_BASE_URL = f"https://{BASE_URL}"
    WS_BASE_URL = f"wss://{BASE_URL}"
    WS_ORIGIN_URL = f"{WS_BASE_URL}"
else:
    HTTP_BASE_URL = f"http://{BASE_URL}:8000"
    WS_BASE_URL = f"ws://{BASE_URL}:9000"
    WS_ORIGIN_URL = f"ws://127.0.0.1"

WS_FRAME_URL = f"{WS_BASE_URL}/ws/frames/"
HTTP_OBTAIN_TOKEN_URL = f"{HTTP_BASE_URL}/api/frames/obtain-frame-ws-auth-token/"
HTTP_VERIFY_TOKEN_URL = f"{HTTP_BASE_URL}/api/frames/verify-frame-token/"

SERIAL_NUMBER = os.getenv("SERIAL_NUMBER")

TOKEN_CACHE_DIR = "/tmp/frame_access_token"
TOKEN_CACHE_FILE = f"{TOKEN_CACHE_DIR}/frame_access_token.json"

# Display config
IMAGES_SAVE_DIR = "/home/frame/Documents/board_data/recieved_images"
STATIC_IMAGES_DIR = "fixtures"

REFRESH_INTERVAL_HOURS = 12
NEXT_REFRESH_WAITING_INTERVALL_MINUTES = 5
IMAGES_LOOP_INTERVALL_MINUTES = 10
