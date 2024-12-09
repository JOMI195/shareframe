from django.utils import timezone
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

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
