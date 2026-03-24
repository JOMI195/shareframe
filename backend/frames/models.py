import os
import string
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.timezone import now
from django.core.exceptions import ValidationError
import uuid
import random


class FrameGroup(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Frame(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    public_serial_number = models.CharField(max_length=100, unique=True)
    private_serial_number = models.CharField(max_length=100, unique=True)

    groups = models.ManyToManyField(
        FrameGroup,
        blank=True,
        related_name="frames",
    )

    is_active = models.BooleanField(default=True)

    registered_at = models.DateTimeField(auto_now_add=True)
    last_connected = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    version = models.CharField(max_length=100, default="1.0.0")
    local_ip_address = models.GenericIPAddressField(null=True, blank=True)

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

    def generate_otp(self, expiry_minutes=10):
        """
        Generates a new OTP for this frame.
        If an unexpired OTP already exists, it will be invalidated.
        """
        # Delete any existing OTP for this frame
        try:
            self.frame_otp.delete()
        except FrameOTP.DoesNotExist:
            pass

        # Create a new OTP
        expires_at = timezone.now() + timezone.timedelta(minutes=int(expiry_minutes))
        otp = FrameOTP.objects.create(frame=self, expires_at=expires_at)

        return otp.code

    def verify_otp(self, code):
        """
        Verifies if the provided OTP code is valid for this frame.
        If valid, the OTP is consumed (deleted).
        """
        try:
            otp = self.frame_otp

            if otp.code != code:
                return False

            if timezone.now() > otp.expires_at:
                otp.delete()
                return False

            # OTP is valid, consume it
            otp.delete()
            return True

        except FrameOTP.DoesNotExist:
            return False


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


class FrameOTP(models.Model):
    """One-Time Password for Frame authentication"""

    frame = models.OneToOneField(
        Frame, on_delete=models.CASCADE, related_name="frame_otp"
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = "".join(random.choices(string.digits, k=6))
        super().save(*args, **kwargs)

    def is_valid(self):
        return self.expires_at is not None and timezone.now() < self.expires_at


class FrameWebsocketConnection(models.Model):
    frame = models.OneToOneField(
        Frame, on_delete=models.CASCADE, related_name="frame_websocket_connections"
    )
    channel_name = models.CharField(max_length=255, unique=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
