import os
from pathlib import Path

DEBUG = os.getenv("DEBUG", False) == "True"
PRODUCTION = os.getenv("PRODUCTION", False) == "True"
MOCK_DISPLAY = os.getenv("MOCK_DISPLAY", False) == "True"
VERSION = os.getenv("VERSION", "1.0.0")

SERIAL_NUMBER = os.getenv("SERIAL_NUMBER")
PUBLIC_SERIAL_NUMBER = os.getenv("PUBLIC_SERIAL_NUMBER")
FRAME_AUTH_SECRET_KEY = os.getenv("FRAME_AUTH_SECRET_KEY")
UPDATE_HASH_SECRET_KEY = os.getenv("UPDATE_HASH_SECRET_KEY")

APPLICATION_SERVICE_NAME = "shareframe.service"

##### shareframe dirs
BASE_DIR = Path(__file__).resolve().parent.parent

APPLICATION_DIR_PATH = BASE_DIR
MEDIA_DEFAULT_FOLDER_PATH = APPLICATION_DIR_PATH / "media"

MEDIA_FOLDER_PATH = BASE_DIR.parent / ".media"
SETTINGS_PERSIST_DIR_PATH = BASE_DIR.parent / ".settings"
CACHE_DIR_PATH = BASE_DIR.parent / ".cache"

##### Logging config
LOGGING_SAVE_DIR = "/var/log/shareframe"
LOGGING_FILE = "shareframe-application.log"
LOGGING_FULL_FILE_PATH = f"{LOGGING_SAVE_DIR}/{LOGGING_FILE}"

##### Websocket client config
BASE_URL = os.getenv("BASE_URL")
HTTP_TIMEOUT_SEC = 600
WEBSOCKET_RECV_TIMEOUT = 60
WEBSOCKET_PING_INTERVAL = 120
WEBSOCKET_PONG_TIMEOUT = 60
WEBSOCKET_CONFIG_INTERVAL_MIN = 10

if PRODUCTION == True:
    HTTP_BASE_URL = f"https://{BASE_URL}"
    WS_BASE_URL = f"wss://{BASE_URL}"
    WS_ORIGIN_URL = f"{WS_BASE_URL}"
else:
    HTTP_BASE_URL = f"http://{BASE_URL}:8000"
    WS_BASE_URL = f"ws://{BASE_URL}:9000"
    WS_ORIGIN_URL = f"ws://127.0.0.1"

WS_FRAME_URL = f"{WS_BASE_URL}/ws/frames/"
HTTP_OBTAIN_TOKEN_URL = f"{HTTP_BASE_URL}/api/frames/obtain-frame-auth-token/"
HTTP_VERIFY_TOKEN_URL = f"{HTTP_BASE_URL}/api/frames/verify-frame-auth-token/"

FRAME_ACCESS_TOKEN_FILE_PATH = CACHE_DIR_PATH / "frame_access_token.json"

IMAGES_STATUS_CHECK_INTERVAL_MINUTES = 15

WEBSOCKET_MESSAGE_MAX_SIZE = 120 * 1024 * 1024  # 120MB

##### Display config
# user images
USER_IMAGES_SAVE_PATH = MEDIA_FOLDER_PATH / "recieved-user-images"

# frame brand photos
DEFAULT_FRAME_IMAGES_PATH = MEDIA_DEFAULT_FOLDER_PATH / "frame"

# static photos
DEFAULT_IMAGES_PATH = MEDIA_DEFAULT_FOLDER_PATH / "default"

MINIMAL_REFRESH_INTERVAL_HOURS = 24
NEXT_REFRESH_WAITING_INTERVALL_MINUTES = 3
IMAGES_LOOP_INTERVALL_MINUTES = 15
CLEAR_DISPLAY_TIMES = ["02:00"]

DISPLAY_IMAGES_LOOP_INTERVAL_FILE_PATH = (
    SETTINGS_PERSIST_DIR_PATH / "display_images_loop_interval.json"
)
DISPLAY_UPDATE_IMAGES_LOOP_INTERVAL_FILE_PATH = (
    APPLICATION_DIR_PATH / "display" / "update_display_images_loop_interval.sh"
)

##### Updates
UPDATE_SERVICE_NAME = "shareframe-update-all.service"
UPDATE_LOGGING_FILE = "shareframe-update.log"
UPDATE_LOGGING_FULL_FILE_PATH = f"{LOGGING_SAVE_DIR}/{UPDATE_LOGGING_FILE}"

UPDATE_VERSION_FILE_NAME = "version.txt"
UPDATE_FILES_LIST_NAME = "files_to_backup.json"
UPDATE_DELETE_FILES_LIST_NAME = "files_to_delete.json"
SCRIPTS_TO_RUN_LIST_NAME = "scripts_to_run.json"
UPDATE_BACKUP_DIR_NAME = ".app_backup"

HTTP_UPDATE_LATEST_URL = f"{HTTP_BASE_URL}/api/frame-updates/latest/"

##### Dashbaord
DASHBOARD_SERVICE_NAME = "shareframe-dashboard.service"
DASHBOARD_LOGGING_FILE = "shareframe-dashboard.log"
DASHBOARD_LOGGING_FULL_FILE_PATH = f"{LOGGING_SAVE_DIR}/{UPDATE_LOGGING_FILE}"

DASHBOARD_HTTP_VERIFY_OTP_URL = f"{HTTP_BASE_URL}/api/frames/verify-frame-otp/"

##### Heartbeat
HEARTBEAT_SERVICE_NAME = "shareframe-heartbeat.service"
HEARTBEAT_LOGGING_FILE = "shareframe-heartbeat.log"
HEARTBEAT_LOGGING_FULL_FILE_PATH = f"{LOGGING_SAVE_DIR}/{HEARTBEAT_LOGGING_FILE}"
HEARTBEAT_HTTP_FRAME_HEARTBEAT_URL = f"{HTTP_BASE_URL}/api/frames/frame-hearbeat/"
HEARTBEAT_HTTP_FRAME_HEARTBEAT_INTERVAL_MINS = 15
HEARTBEAT_MAX_RETRY_DELAY_SECS = 10 * 60  # Maximum retry delay of 10 minutes
