import asyncio
import json
import time
import requests
import websockets


class FrameWebSocketClient:
    def __init__(
        self,
        base_url="http://127.0.0.1",
        websocket_url="ws://127.0.0.1/ws/frames/",
        private_serial_number="L1GX1-Z79JY-Z6C9T-4HV84-XJPQO",
    ):
        self.base_url = base_url
        self.websocket_url = websocket_url
        self.private_serial_number = private_serial_number
        self.access_token = None
        self.token_expires_at = None

    def verify_token(self):
        if not self.access_token:
            return False

        try:
            response = requests.post(
                f"{self.base_url}/api/frames/verify-frame-token/",
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
                f"{self.base_url}/api/frames/obtain-frame-ws-auth-token/",
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
            "Origin": "ws://127.0.0.1",
        }

        try:
            async with websockets.connect(
                self.websocket_url,
                additional_headers=headers,
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
    asyncio.run(main())
