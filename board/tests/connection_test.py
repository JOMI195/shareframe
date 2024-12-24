import asyncio
import json
import os
import ssl
import time
import certifi
from dotenv import load_dotenv
import requests
import websockets


class FrameWebSocketClient:
    def __init__(
        self,
    ):
        base_url = os.getenv("BASE_URL", "127.0.0.1")
        self.http_base_url = f"https://{base_url}"
        self.websocket_url = f"wss://{base_url}"

        self.private_serial_number = os.getenv("SERIAL_NUMBER")
        self.access_token = None
        self.token_expires_at = None

    def verify_token(self):
        if not self.access_token:
            return False

        try:
            response = requests.post(
                f"{self.http_base_url}/api/frames/verify-frame-token/",
                json={"access_token": self.access_token},
                timeout=10,
            )

            if response.status_code == 200:
                return True

            return False
        except Exception as e:
            print(f"Token verification error: {e}")
            return False

    def _is_token_valid(self):
        if not self.access_token or not self.token_expires_at:
            return False

        current_time = time.time()
        return str(current_time) < self.token_expires_at

    def obtain_token(self):
        try:
            response = requests.post(
                f"{self.http_base_url}/api/frames/obtain-frame-ws-auth-token/",
                data={"private_serial_number": self.private_serial_number},
                timeout=10,
            )
            response.raise_for_status()
            token_data = response.json()

            self.access_token = token_data["access_token"]
            self.token_expires_at = token_data["expires_at"]

            print(f"New token obtained. Expires at: {self.token_expires_at}")
            return True
        except Exception as e:
            print(f"Token obtain error: {e}")
            return False

    async def connect_websocket(self):
        if not self._is_token_valid():
            if not self.obtain_token():
                print("Failed to obtain a valid token")
                return False

        headers = {
            "Authorization": f"Frame-Access-Token {self.access_token}",
            "Origin": self.websocket_url,
        }
        ssl_context = ssl.create_default_context()
        ssl_context.load_verify_locations(certifi.where())

        try:
            async with websockets.connect(
                self.websocket_url + "/ws/frames/",
                open_timeout=3600,
                additional_headers=headers,
                ssl=ssl_context,
            ) as websocket:
                print("WebSocket connection established")
                try:
                    while True:
                        message = await websocket.recv()
                        try:
                            parsed_message = json.loads(message)
                            print(f"Received message: {parsed_message}")
                        except json.JSONDecodeError:
                            print(f"Received non-JSON message: {message}")
                except websockets.ConnectionClosed:
                    print("WebSocket connection closed")
                    return False
        except Exception as e:
            print(f"WebSocket connection error: {e}")
            if not self.verify_token():
                self.obtain_token()
            return False

    async def run(self):
        while True:
            connection_result = await self.connect_websocket()

            if not connection_result:
                await asyncio.sleep(10)
            else:
                await asyncio.sleep(60)


async def main():
    client = FrameWebSocketClient()
    await client.run()


if __name__ == "__main__":
    load_dotenv()
    asyncio.run(main())
