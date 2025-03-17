import os
from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid


class Frame(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    public_serial_number = models.CharField(max_length=100, unique=True)
    private_serial_number = models.CharField(max_length=100, unique=True)

    is_active = models.BooleanField(default=True)

    registered_at = models.DateTimeField(auto_now_add=True)
    last_connected = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(auto_now=True)

    version = models.CharField(max_length=100, default="1.0.0")

    def get_or_create_token(self):
        """
        Retrieves the existing token if it's valid and not close to expiring,
        or creates a new one if it's expired or about to expire.
        Returns the token object.
        """

        access_token_expiration_window_hours = os.environ.get(
            "DJANGO_FRAME_ACCESSTOKEN_EXPIRATION_WINDOW_HOURS", 24
        )
        expiration_window = timezone.timedelta(
            hours=int(access_token_expiration_window_hours)
        )

        try:
            token = self.frame_token

            approaching_expiration = token.access_token_expires_at - expiration_window

            if (
                token.is_access_token_valid()
                and timezone.now() < approaching_expiration
            ):
                return token

        except FrameToken.DoesNotExist:
            pass

        FrameToken.objects.filter(frame=self).delete()

        token_data = FrameToken.generate_tokens(self)

        return FrameToken.objects.create(frame=self, **token_data)


class FrameToken(models.Model):
    frame = models.OneToOneField(
        Frame, on_delete=models.CASCADE, related_name="frame_token"
    )
    access_token = models.CharField(max_length=255, unique=True)
    access_token_expires_at = models.DateTimeField()
    last_obtained = models.DateTimeField(auto_now=True)

    @classmethod
    def generate_tokens(cls, frame):
        access_token_lifetime_days = os.environ.get(
            "DJANGO_FRAME_ACCESSTOKEN_LIFETIME_DAYS", 7
        )
        return {
            "access_token": str(uuid.uuid4()),
            "access_token_expires_at": timezone.now()
            + timezone.timedelta(days=int(access_token_lifetime_days)),
        }

    def is_access_token_valid(self):
        return timezone.now() < self.access_token_expires_at


class FrameWebsocketConnection(models.Model):
    frame = models.OneToOneField(
        Frame, on_delete=models.CASCADE, related_name="frame_websocket_connections"
    )
    channel_name = models.CharField(max_length=255, unique=True)
    local_ip_address = models.GenericIPAddressField(null=True, blank=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
