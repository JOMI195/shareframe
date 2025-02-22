import os
from pathlib import Path

DEBUG = os.getenv("DEBUG", False) == "True"
PRODUCTION = os.getenv("PRODUCTION", False) == "True"
BASE_DIR = Path(__file__).resolve().parent.parent

MEDIA_FOLDER = "media"

# Logging config
LOGGING_SAVE_DIR = "/var/log/shareframe"
LOGGING_FILE = "shareframe-application.log"
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

TOKEN_CACHE_DIR = ".cache"
TOKEN_CACHE_FILE = f"{TOKEN_CACHE_DIR}/frame_access_token.json"

IMAGES_STATUS_CHECK_INTERVAL_MINUTES = 15

WEBSOCKET_MESSAGE_MAX_SIZE = 10 * 1024 * 1024  # 10MB

# Display config
USER_IMAGES_SAVE_DIR = f"{MEDIA_FOLDER}/recieved-user-images"
DEFAULT_FRAME_IMAGES_DIR = f"{MEDIA_FOLDER}/frame"
DEFAULT_IMAGES_DIR = f"{MEDIA_FOLDER}/default"

REFRESH_INTERVAL_HOURS = 12
NEXT_REFRESH_WAITING_INTERVALL_MINUTES = 3
IMAGES_LOOP_INTERVALL_MINUTES = 15
