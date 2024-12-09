import base64
from django.utils import timezone
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer

from images.models import Image
from user_core.models import User

from .models import FrameWebsocketConnection


class FrameWebSocketConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def update_last_connected(self, frame):
        frame.last_connected = timezone.now()
        frame.save()

    @database_sync_to_async
    def save_connection(self, frame):
        FrameWebsocketConnection.objects.filter(frame=frame).delete()

        FrameWebsocketConnection.objects.create(
            frame=frame,
            channel_name=self.channel_name,
        )

    @database_sync_to_async
    def remove_connection(self):
        FrameWebsocketConnection.objects.filter(channel_name=self.channel_name).delete()

    @database_sync_to_async
    def get_user_frame_connections(self, receiver):
        return list(
            FrameWebsocketConnection.objects.filter(
                frame__user=receiver, frame__is_active=True
            )
        )

    @classmethod
    async def send_picture_to_user_frames(
        cls, sender: User, receiver: User, image: Image
    ):
        channel_layer = get_channel_layer()
        connections = await cls.get_user_frame_connections(receiver)

        with open(image.image.path, "rb") as image_file:
            picture_data = base64.b64encode(image_file.read()).decode("utf-8")

        message = {"type": "picture", "sender": sender.username, "data": picture_data}

        for connection in connections:
            await channel_layer.send(
                connection.channel_name,
                {"type": "send_picture", "picture_data": json.dumps(message)},
            )

    # ------------------------------
    async def connect(self):
        frame = self.scope.get("frame")

        if frame:
            await self.accept()
            await self.update_last_connected(frame)
            await self.save_connection(frame)
        else:
            await self.close()

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

    async def send_picture(self, event):
        await self.send(text_data=event["picture_data"])
