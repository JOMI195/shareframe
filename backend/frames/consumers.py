import base64
from datetime import datetime
from typing import Optional
from django.utils import timezone
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer


from sent_images.models import SentImage
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

    @database_sync_to_async
    def get_missing_sent_images(self, frame_user: User, sent_image_ids: list[int]):
        return list(
            SentImage.objects.filter(
                reciever=frame_user,
                expires_at__gt=timezone.now(),  # Only get non-expired images
            )
            .exclude(id__in=sent_image_ids)  # Exclude images we already have
            .select_related("sender", "reciever", "image")
        )

    @database_sync_to_async
    def prepare_image_data(self, sent_image: Image):
        with open(sent_image.image.image.path, "rb") as image_file:
            picture_data = base64.b64encode(image_file.read()).decode("utf-8")

        expiry_unix_timestamp = None
        if sent_image.expires_at:
            expiry_unix_timestamp = int(sent_image.expires_at.timestamp())

        return {
            "sender": sent_image.sender,
            "reciever": sent_image.reciever,
            "image": sent_image.image,
            "picture_data": picture_data,
            "expiry_unix_timestamp": expiry_unix_timestamp,
            "expiry_datetime": sent_image.expires_at,
            "sent_image_id": sent_image.id,
        }

    async def handle_check_sent_images(self, message_data: dict):
        try:
            frame = self.scope.get("frame")
            if not frame or not frame.user:
                print("No frame or user found in scope")
                return

            sent_image_ids = message_data.get("sent_image_ids", [])
            print(
                f"Checking for missing images for user {frame.user.username}, "
                f"excluding {len(sent_image_ids)} existing IDs"
            )

            missing_images = await self.get_missing_sent_images(
                frame.user, sent_image_ids
            )

            print(f"Found {len(missing_images)} missing images to send")

            for sent_image in missing_images:
                image_data = await self.prepare_image_data(sent_image)

                await self.__class__.send_picture_to_user_frames(
                    sender=image_data["sender"],
                    reciever=image_data["reciever"],
                    image=image_data["image"],
                    expiry_unix_timestamp=image_data["expiry_unix_timestamp"],
                    expiry_datetime=image_data["expiry_datetime"],
                    sent_image_id=image_data["sent_image_id"],
                )

        except Exception as e:
            print(f"Error handling check_sent_images: {str(e)}")
            import traceback

            traceback.print_exc()

    @classmethod
    async def send_picture_to_user_frames(
        cls,
        sender: User,
        reciever: User,
        image: Image,
        expiry_unix_timestamp: Optional[int] = None,
        expiry_datetime: Optional[datetime] = None,
        sent_image_id: Optional[int] = None,
    ):
        channel_layer = get_channel_layer()
        connections = await cls.get_user_frame_connections(reciever)

        with open(image.image.path, "rb") as image_file:
            picture_data = base64.b64encode(image_file.read()).decode("utf-8")

        if sent_image_id is None:
            sent_image = await database_sync_to_async(SentImage.objects.create)(
                sender=sender,
                reciever=reciever,
                image=image,
                expires_at=expiry_datetime,
            )
            sent_image_id = sent_image.id

        message = {
            "type": "picture",
            "sender": sender.username,
            "data": picture_data,
            "expiry_unix_timestamp": expiry_unix_timestamp,
            "sent_image_id": sent_image_id,
        }

        try:
            for connection in connections:
                await channel_layer.send(
                    connection.channel_name,
                    {"type": "send_picture", "picture_data": json.dumps(message)},
                )
        except Exception as e:
            if sent_image_id is None:
                await database_sync_to_async(sent_image.delete)()
            raise e

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
            elif message_type == "check_sent_images":
                await self.handle_check_sent_images(message)
            else:
                print(f"Received unknown message type: {message_type}")

        except json.JSONDecodeError:
            print("Received invalid JSON")
        except Exception as e:
            print(f"Error processing message: {e}")

    async def send_picture(self, event):
        await self.send(text_data=event["picture_data"])
