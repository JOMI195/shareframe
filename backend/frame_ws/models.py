from django.db import models
from django.conf import settings


class Frame(models.Model):
    serial_number = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.serial_number}"


class FrameWebsocketConnection(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="frame_websocket_connections",
    )
    frame = models.OneToOneField(
        Frame, on_delete=models.CASCADE, related_name="frame_websocket_connection"
    )
    channel_name = models.CharField(max_length=255, unique=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "frame")

    def __str__(self):
        return f"{self.user.username} - {self.frame.serial_number}"
