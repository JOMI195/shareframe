from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
import base64

from .models import FrameWebsocketConnection, Frame
from channels.layers import get_channel_layer


class FrameWebSocketConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        serial_number = self.scope["url_route"]["kwargs"].get("serial_number")

        if not serial_number:
            await self.close()
            return

        frame = await self.get_frame(serial_number)
        if not frame:
            await self.close()
            return

        await self.accept()

        await self.save_connection(frame)

    async def disconnect(self, text_data):
        await self.remove_connection()

    async def close_connection(self, text_data):
        await self.close()

    async def receive(self, text_data):
        try:
            message = json.loads(text_data)
            message_type = message.get("type")

            if message_type == "close_connection":
                await self.close_connection()
            elif message_type == "text":
                content = message.get("content", "")
                print(f"Received text message: {content}")
            else:
                print(f"Received unknown message type: {message_type}")

        except json.JSONDecodeError:
            print("Received invalid JSON")
        except Exception as e:
            print(f"Error processing message: {e}")

    @database_sync_to_async
    def get_frame(self, serial_number):
        try:
            return Frame.objects.get(serial_number=serial_number, is_active=True)
        except Frame.DoesNotExist:
            return None

    @database_sync_to_async
    def save_connection(self, frame):
        FrameWebsocketConnection.objects.filter(
            user=self.scope["user"], frame=frame
        ).delete()

        FrameWebsocketConnection.objects.create(
            user=self.scope["user"],
            frame=frame,
            channel_name=self.channel_name,
        )

    @database_sync_to_async
    def remove_connection(self):
        FrameWebsocketConnection.objects.filter(channel_name=self.channel_name).delete()

    async def send_picture(self, picture_data):
        await self.send(text_data=json.dumps({"type": "picture", "data": picture_data}))

    async def send_text(self, text):
        await self.send(text_data=json.dumps({"type": "text", "data": text}))


# Utility function to send pictures to specific users
async def send_picture_to_user(user, picture_path):
    # Get channel layer
    channel_layer = get_channel_layer()

    # Get active connections for the user
    connections = FrameWebsocketConnection.objects.filter(user=user)

    # Read picture file
    with open(picture_path, "rb") as image_file:
        picture_data = base64.b64encode(image_file.read()).decode("utf-8")

    # Send to each active connection
    for connection in connections:
        await channel_layer.send(
            connection.channel_name,
            {"type": "send_picture", "picture_data": picture_data},
        )


async def send_text_to_user(user):
    channel_layer = get_channel_layer()

    connections = FrameWebsocketConnection.objects.filter(user=user)

    for connection in connections:
        await channel_layer.send(
            connection.channel_name,
            {"type": "send_text", "content": "Hello World"},
        )
