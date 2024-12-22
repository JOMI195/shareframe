import os
import base64
import time
from typing import Dict, Optional
from config import settings


class ImageProcessor:
    def __init__(self):
        self.save_directory = settings.IMAGES_SAVE_DIR
        os.makedirs(self.save_directory, exist_ok=True)

    def process_image_message(self, message: Dict) -> Optional[str]:
        if not all(key in message for key in ["type", "sender", "data"]):
            print("Invalid message format")
            return None

        if message["type"] != "picture":
            print("Not a picture message")
            return None

        try:
            image_data = base64.b64decode(message["data"])

            filename = f"{message['sender']}_{int(time.time())}.jpg"
            filepath = os.path.join(self.save_directory, filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, "wb") as f:
                f.write(image_data)

            print(f"Image saved: {filepath}")
            return filepath

        except Exception as e:
            print(f"Image processing error: {e}")
            return None
