import logging
from config.celery import celery
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import Frame, FrameWebsocketConnection
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger("celery.frames")


@celery.task
def close_and_delete_long_inactive_frame_websocket_connections():
    """Closes and deletes frameWebsocketConnections with frames that haven't sent heartbeats in a long time."""

    heartbeat_timeout = getattr(settings, "FRAME_HEARTBEAT_TIMEOUT_MINUTES", 60)
    threshold_time = timezone.now() - timedelta(minutes=heartbeat_timeout)

    stale_frames = Frame.objects.filter(
        Q(last_seen__lt=threshold_time) | Q(last_seen__isnull=True)
    )
    stale_connections = FrameWebsocketConnection.objects.filter(frame__in=stale_frames)
    deleted_count = stale_connections.count()

    logger.info(
        f"Found {deleted_count} inactive connections to close (timeout: {heartbeat_timeout}m)"
    )

    if deleted_count > 0:
        channel_layer = get_channel_layer()
        error_count = 0

        for connection in stale_connections:
            try:
                async_to_sync(channel_layer.send)(
                    connection.channel_name, {"type": "close_connection"}
                )
            except Exception as e:
                error_count += 1
                logger.error(
                    f"Failed to close connection {connection.channel_name}: {str(e)}"
                )

        stale_connections.delete()

        if error_count > 0:
            logger.warning(
                f"Encountered {error_count} errors while closing connections"
            )

    logger.info(f"Closed and deleted {deleted_count} inactive connections")
    return f"Closed and deleted {deleted_count} long inactive connections."
