from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from .models import FrameWebsocketConnection, Frame
from asgiref.sync import async_to_sync


@receiver(post_save, sender=Frame)
def handle_frame_status_change(sender, instance, **kwargs):
    if not instance.is_active:
        connections = FrameWebsocketConnection.objects.filter(frame=instance)

        channel_layer = get_channel_layer()

        for connection in connections:
            async_to_sync(channel_layer.send)(
                connection.channel_name, {"type": "close_connection"}
            )


@receiver(post_save, sender=Frame)
def handle_frame_user_change(sender, instance, **kwargs):
    if not instance.user:
        connections = FrameWebsocketConnection.objects.filter(frame=instance)

        channel_layer = get_channel_layer()

        for connection in connections:
            async_to_sync(channel_layer.send)(
                connection.channel_name, {"type": "close_connection"}
            )
