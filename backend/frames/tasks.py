from config.celery import celery
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import Frame, FrameWebsocketConnection
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


@celery.task
def close_and_delete_long_inactive_frame_websocket_connections():
    """Closes and deletes frameWebsocketConnections with frames that haven't sent heartbeats in a long time."""

    heartbeat_timeout = getattr(settings, "FRAME_HEARTBEAT_TIMEOUT_MINUTES", 60)
    threshold_time = timezone.now() - timedelta(minutes=heartbeat_timeout)

    stale_frames = Frame.objects.filter(last_board_heartbeat__lt=threshold_time)

    stale_connections = FrameWebsocketConnection.objects.filter(frame__in=stale_frames)

    deletedConnections = stale_connections.count()

    if deletedConnections > 0:
        channel_layer = get_channel_layer()

        for connection in stale_connections:
            try:
                async_to_sync(channel_layer.send)(
                    connection.channel_name, {"type": "close_connection"}
                )
            except Exception as e:
                print(f"Error closing connection {connection.channel_name}: {str(e)}")

        stale_connections.delete()

    return f"Closed and deleted {deletedConnections} long inactive frameWebsocketConnections."
