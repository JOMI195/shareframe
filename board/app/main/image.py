import os
import base64
import time
import logging
from typing import Dict, Optional
from config import settings


class ImageProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing image processor")

        save_directory_path = settings.USER_IMAGES_SAVE_PATH
        self.save_directory = save_directory_path.as_posix()
        try:
            os.makedirs(self.save_directory, exist_ok=True)
            self.logger.info(f"Initialized image save directory: {self.save_directory}")
        except Exception as e:
            self.logger.error(
                f"Failed to create save directory: {str(e)}", exc_info=True
            )
            raise

        self.logger.info("Initializing image processor successful")

    def process_image_message(self, message: Dict) -> Optional[str]:
        if not all(key in message for key in ["type", "sender", "data"]):
            self.logger.error(
                "Invalid message format", extra={"message_keys": message.keys()}
            )
            return None

        if message["type"] != "picture":
            self.logger.warning(f"Unexpected message type: {message['type']}")
            return None

        try:
            image_data = base64.b64decode(message["data"])
            filename = f"{message['sender']}_{int(time.time())}_{message['expiry_unix_timestamp']}_{message['sent_image_id']}.jpg"
            filepath = os.path.join(self.save_directory, filename)

            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, "wb") as f:
                f.write(image_data)

            self.logger.info(f"Image {filepath} saved successful")
            return filepath

        except base64.binascii.Error as e:
            self.logger.error("Failed to decode base64 image data", exc_info=True)
            return None
        except OSError as e:
            self.logger.error(f"Failed to save image file: {str(e)}", exc_info=True)
            return None
        except Exception as e:
            self.logger.error(
                f"Unexpected error processing image: {str(e)}", exc_info=True
            )
            return None
