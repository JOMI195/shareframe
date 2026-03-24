import base64
from datetime import datetime
import logging
from typing import List, Optional
from django.utils import timezone
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer


from sent_images.models import SentImage
from images.models import Image
from user_core.models import User

from .close_codes import WS_CLOSE_AUTH_REJECTED, WS_CLOSE_TOKEN_REVOKED
from .models import FrameWebsocketConnection

logger = logging.getLogger("websockets.frames")


class FrameWebSocketConsumer(AsyncWebsocketConsumer):

    @database_sync_to_async
    def update_last_seen(self):
        try:
            frame = self.scope.get("frame")
            if frame:
                frame.last_seen = timezone.now()
                frame.save(update_fields=["last_seen"])
                connection = FrameWebsocketConnection.objects.get(
                    frame=frame, channel_name=self.channel_name
                )
                connection.last_active = timezone.now()
                connection.save(update_fields=["last_active"])
        except Exception as e:
            logger.error(f"Error updating last seen fields: {str(e)}")

    @database_sync_to_async
    def update_last_connected(self, frame):
        frame.last_connected = timezone.now()
        frame.save(update_fields=["last_connected"])
        logger.debug(f"Updated last_connected for frame {frame.id}")

    @database_sync_to_async
    def save_connection(self, frame):
        deleted_count = FrameWebsocketConnection.objects.filter(frame=frame).delete()[0]
        if deleted_count > 0:
            logger.info(
                f"Deleted {deleted_count} existing connection(s) for frame {frame.id}"
            )

        connection = FrameWebsocketConnection.objects.create(
            frame=frame,
            channel_name=self.channel_name,
        )
        logger.info(
            f"Created new connection for frame {frame.id} with channel {self.channel_name}"
        )
        return connection

    @database_sync_to_async
    def remove_connection(self):
        deleted_count = FrameWebsocketConnection.objects.filter(
            channel_name=self.channel_name
        ).delete()[0]
        if deleted_count > 0:
            logger.info(f"Removed connection with channel {self.channel_name}")
        return deleted_count

    @database_sync_to_async
    def update_connection_ip(self, local_ip_address):
        try:
            frame = self.scope.get("frame")
            if frame:
                old_ip = frame.local_ip_address
                frame.local_ip_address = local_ip_address
                frame.save(update_fields=["local_ip_address"])
                logger.info(
                    f"Updated local IP for frame {frame.id} from {old_ip} to {local_ip_address}"
                )
        except Exception as e:
            logger.error(f"Error updating connection IP: {str(e)}")

    @database_sync_to_async
    def update_version(self, version):
        try:
            frame = self.scope.get("frame")
            if frame:
                old_version = frame.version
                frame.version = version
                frame.save(update_fields=["version"])
                logger.info(
                    f"Updated version for frame {frame.id} from {old_version} to {version}"
                )
        except Exception as e:
            logger.error(f"Error updating frame version: {str(e)}")

    @classmethod
    @database_sync_to_async
    def get_user_frame_connections(cls, receiver):
        connections = list(
            FrameWebsocketConnection.objects.filter(
                frame__user=receiver, frame__is_active=True
            )
        )
        logger.debug(
            f"Found {len(connections)} active connections for user {receiver.username}"
        )
        return connections

    @database_sync_to_async
    def get_missing_sent_images(self, frame_user: User, sent_image_ids: list[int]):
        missing_images = list(
            SentImage.objects.filter(
                reciever=frame_user,
                expires_at__gt=timezone.now(),  # Only get non-expired images
            )
            .exclude(id__in=sent_image_ids)  # Exclude images we already have
            .select_related("sender", "reciever", "image")
        )
        logger.debug(
            f"Found {len(missing_images)} missing images for user {frame_user.username}"
        )
        return missing_images

    @database_sync_to_async
    def get_sent_image(self, frame_user: User, sent_image_id: int):
        try:
            return SentImage.objects.get(reciever=frame_user, id=sent_image_id)
        except SentImage.DoesNotExist:
            logger.warning(
                f"SentImage with ID {sent_image_id} not found for user {frame_user.username}"
            )
            return None
        except SentImage.MultipleObjectsReturned:
            logger.error(
                f"Multiple SentImages found with ID {sent_image_id} for user {frame_user.username}"
            )
            return None

    @database_sync_to_async
    def prepare_image_data(self, sent_image: SentImage):
        try:
            with open(sent_image.image.image.path, "rb") as image_file:
                picture_data = base64.b64encode(image_file.read()).decode("utf-8")

            expiry_unix_timestamp = None
            if sent_image.expires_at:
                expiry_unix_timestamp = int(sent_image.expires_at.timestamp())

            logger.debug(f"Prepared image data for sent_image_id={sent_image.id}")

            return {
                "sender": sent_image.sender,
                "reciever": sent_image.reciever,
                "image": sent_image.image,
                "picture_data": picture_data,
                "expiry_unix_timestamp": expiry_unix_timestamp,
                "expiry_datetime": sent_image.expires_at,
                "sent_image_id": sent_image.id,
            }
        except Exception as e:
            logger.error(
                f"Error preparing image data for sent_image_id={sent_image.id}: {str(e)}"
            )
            raise

    async def handle_check_user_frame_missing_images(self, message_data: dict):
        try:
            frame = self.scope.get("frame")
            if not frame or not frame.user:
                logger.warning(
                    "No frame or user found in scope during missing images check"
                )
                return

            current_images = message_data.get("sent_image_ids", [])

            logger.info(
                f"Checking missing images for user {frame.user.username}, "
                f"frame {frame.id}, "
                f"comparing {len(current_images)} existing images"
            )

            missing_images = await self.get_missing_sent_images(
                frame.user, current_images
            )

            images_to_send = []
            for sent_image in missing_images:
                if sent_image.id not in current_images:
                    images_to_send.append(sent_image)

            logger.info(
                f"Found {len(images_to_send)} missing images to send to frame {frame.id}"
            )

            for sent_image in images_to_send:
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
            logger.exception(f"Error handling check_missing_images: {str(e)}")

    async def handle_check_user_frame_images_expiry(self, message_data: dict):
        try:
            frame = self.scope.get("frame")
            if not frame or not frame.user:
                logger.warning("No frame or user found in scope during expiry check")
                return

            current_images: List[dict] = message_data.get("user_frame_images", [])

            logger.info(
                f"Checking expiry for user {frame.user.username}, "
                f"frame {frame.id}, "
                f"comparing {len(current_images)} existing images"
            )

            images_to_send = []
            images_to_delete = []

            for image_entry in current_images:
                board_image_id = image_entry.get("sent_image_id")
                board_image_expires_at = image_entry.get("expires_at")

                if board_image_id is None or board_image_expires_at is None:
                    logger.warning(f"Skipping malformed image entry: {image_entry}")
                    continue

                sent_image = await self.get_sent_image(frame.user, int(board_image_id))
                if sent_image is not None:
                    sent_image_expiry = int(sent_image.expires_at.timestamp())

                    # Case 1: Expired images
                    if sent_image_expiry < int(datetime.now().timestamp()):
                        logger.debug(
                            f"Image {board_image_id} has expired and will be deleted"
                        )
                        images_to_delete.append(board_image_id)

                    # Case 2: Mismatched expiry timestamps
                    elif int(board_image_expires_at) != sent_image_expiry:
                        logger.debug(
                            f"Image {board_image_id} has mismatched expiry and will be updated"
                        )
                        images_to_send.append(sent_image)

                else:  # Case 3: When not found, delete it
                    logger.debug(
                        f"Image {board_image_id} not found in database and will be deleted from frame"
                    )
                    images_to_delete.append(board_image_id)

            logger.info(
                f"Found {len(images_to_send)} images to update for frame {frame.id}"
            )
            logger.info(
                f"Found {len(images_to_delete)} expired images to delete from frame {frame.id}"
            )

            for sent_image in images_to_send:
                image_data = await self.prepare_image_data(sent_image)

                await self.__class__.send_picture_to_user_frames(
                    sender=image_data["sender"],
                    reciever=image_data["reciever"],
                    image=image_data["image"],
                    expiry_unix_timestamp=image_data["expiry_unix_timestamp"],
                    expiry_datetime=image_data["expiry_datetime"],
                    sent_image_id=image_data["sent_image_id"],
                )

            if len(images_to_delete) > 0:
                await self.__class__.send_clear_specific_images_to_user_frames(
                    frame.user, images_to_delete
                )

        except Exception as e:
            logger.exception(f"Error handling check_images_expiry: {str(e)}")

    async def handle_heartbeat(self, message):
        frame = self.scope.get("frame")
        frame_id = frame.id if frame else "unknown"
        logger.debug(f"Received heartbeat from frame {frame_id}")

    async def handle_ping(self, message):
        timestamp = message.get("timestamp")
        logger.debug(f"Received ping with timestamp {timestamp}")
        await self.send(json.dumps({"type": "pong", "timestamp": timestamp}))

    async def handle_config_transmit(self, message):
        frame = self.scope.get("frame")
        logger.info(f"Received config for frame {frame.id if frame else 'unknown'}")

        local_ip_address = message.get("local_ip_address")
        if local_ip_address:
            await self.update_connection_ip(local_ip_address)

        version = message.get("version")
        if version:
            await self.update_version(version)

    @classmethod
    async def send_clear_specific_images_to_user_frames(
        cls, receiver: User, sent_image_ids: list[int]
    ):
        channel_layer = get_channel_layer()
        connections = await cls.get_user_frame_connections(receiver)

        message = {
            "type": "clear_specific_sent_images",
            "sent_image_ids": sent_image_ids,
        }

        logger.info(
            f"Sending clear command for {len(sent_image_ids)} images to {len(connections)} connections"
        )

        for connection in connections:
            await channel_layer.send(
                connection.channel_name,
                {"type": "clear_specific_sent_images", "data": json.dumps(message)},
            )

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

        logger.info(
            f"Sending image from {sender.username} to {reciever.username}'s {len(connections)} "
            f"connected frames (sent_image_id={sent_image_id})"
        )

        try:
            with open(image.image.path, "rb") as image_file:
                picture_data = base64.b64encode(image_file.read()).decode("utf-8")
        except Exception as e:
            logger.error(f"Failed to read image file at {image.image.path}: {str(e)}")
            raise

        if sent_image_id is None:
            try:
                sent_image = await database_sync_to_async(SentImage.objects.create)(
                    sender=sender,
                    reciever=reciever,
                    image=image,
                    expires_at=expiry_datetime,
                )
                sent_image_id = sent_image.id
                logger.info(f"Created new SentImage with ID {sent_image_id}")
            except Exception as e:
                logger.error(f"Failed to create SentImage record: {str(e)}")
                raise

        message = {
            "type": "picture",
            "sender": sender.username,
            "data": picture_data,
            "expiry_unix_timestamp": expiry_unix_timestamp,
            "sent_image_id": sent_image_id,
        }

        try:
            for connection in connections:
                logger.debug(f"Sending picture to channel {connection.channel_name}")
                await channel_layer.send(
                    connection.channel_name,
                    {"type": "send_picture", "picture_data": json.dumps(message)},
                )
        except Exception as e:
            logger.error(f"Error sending picture to channels: {str(e)}")
            if sent_image_id is None and "sent_image" in locals():
                logger.info(f"Cleaning up sent_image {sent_image.id} after error")
                await database_sync_to_async(sent_image.delete)()
            raise e

    # ------------------------------
    async def send(self, text_data=None, bytes_data=None, close=False):
        await self.update_last_seen()
        await super().send(text_data=text_data, bytes_data=bytes_data, close=close)

    async def connect(self):
        logger.info(f"New connection attempt")
        frame = self.scope.get("frame")

        if frame:
            await self.accept()
            logger.info(f"New connection accepted for frame {frame.id}")
            await self.update_last_connected(frame)
            await self.save_connection(frame)
            await self.update_last_seen()
        else:
            logger.warning(f"Connection rejected - no frame in scope")
            await self.close(code=WS_CLOSE_AUTH_REJECTED)

    async def disconnect(self, close_code):
        frame = self.scope.get("frame")
        frame_id = frame.id if frame else "unknown"
        logger.info(
            f"Connection disconnected for frame {frame_id} with code {close_code}"
        )
        await self.remove_connection()

    async def close_connection(self, *args, **kwargs):
        frame = self.scope.get("frame")
        frame_id = frame.id if frame else "unknown"
        logger.info(f"Connection closing for frame {frame_id}")
        await self.close(code=WS_CLOSE_TOKEN_REVOKED)

    async def receive(self, text_data):
        await self.update_last_seen()

        try:
            message = json.loads(text_data)
            message_type = message.get("type")
            frame = self.scope.get("frame")
            frame_id = frame.id if frame else "unknown"

            logger.debug(
                f"Received message type '{message_type}' from frame {frame_id}"
            )

            if message_type == "close_connection":
                await self.close_connection()
            elif message_type == "heartbeat":
                await self.handle_heartbeat(message)
            elif message_type == "ping":
                await self.handle_ping(message)
            elif message_type == "config":
                await self.handle_config_transmit(message)
            elif message_type == "text":
                content = message.get("content", "")
                logger.info(f"Received text message from frame {frame_id}: {content}")
            elif message_type == "check_sent_images_expiry":
                await self.handle_check_user_frame_images_expiry(message)
            elif message_type == "check_missing_images":
                await self.handle_check_user_frame_missing_images(message)
            # TODO delete when all frames updated with typo fix
            elif message_type == "check_mssing_images":
                await self.handle_check_user_frame_missing_images(message)
            else:
                logger.warning(
                    f"Received unknown message type: {message_type} from frame {frame_id}"
                )

        except json.JSONDecodeError:
            logger.error("Received invalid JSON")
        except Exception as e:
            logger.exception(f"Error processing message: {str(e)}")

    async def send_picture(self, event):
        frame = self.scope.get("frame")
        frame_id = frame.id if frame else "unknown"

        try:
            message = json.loads(event["picture_data"])
            sent_image_id = message.get("sent_image_id")
            logger.debug(
                f"Sending picture to frame {frame_id} (sent_image_id={sent_image_id})"
            )
        except (KeyError, json.JSONDecodeError):
            logger.debug(f"Sending picture to frame {frame_id}")

        await self.send(text_data=event["picture_data"])

    async def clear_specific_sent_images(self, event):
        frame = self.scope.get("frame")
        frame_id = frame.id if frame else "unknown"

        try:
            message = json.loads(event["data"])
            sent_image_ids = message.get("sent_image_ids", [])
            logger.debug(f"Clearing {len(sent_image_ids)} images from frame {frame_id}")
        except (KeyError, json.JSONDecodeError):
            logger.debug(f"Clearing images from frame {frame_id}")

        await self.send(text_data=event["data"])
