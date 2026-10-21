import base64
import os
import random
import secrets
import string
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils import timezone

from .keys import public_key_fingerprint


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
    public_key = models.CharField(
        max_length=44,
        null=True,
        blank=True,
        unique=True,
        help_text="Base64-encoded ed25519 public key (32 bytes).",
    )

    groups = models.ManyToManyField(
        FrameGroup,
        blank=True,
        related_name="frames",
    )

    is_active = models.BooleanField(default=True)

    registered_at = models.DateTimeField(auto_now_add=True)
    last_connected = models.DateTimeField(null=True, blank=True)
    # Any sign of life from the frame itself: heartbeat, ws connect or ws message.
    last_seen = models.DateTimeField(null=True, blank=True)
    last_heartbeat = models.DateTimeField(null=True, blank=True)
    last_update_check = models.DateTimeField(null=True, blank=True)
    # Last release bundle download the frame was granted.
    last_update_attempt = models.DateTimeField(null=True, blank=True)

    version = models.CharField(max_length=100, default="1.0.0")
    local_ip_address = models.GenericIPAddressField(null=True, blank=True)
    # Latest heartbeat body, exported to Prometheus by metrics.collectors.
    last_telemetry = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.public_serial_number

    def clean(self):
        super().clean()
        if self.public_key:
            try:
                raw = base64.b64decode(self.public_key)
                if len(raw) != 32:
                    raise ValidationError(
                        {"public_key": "Key must decode to exactly 32 bytes."}
                    )
            except (ValueError, Exception) as e:
                if isinstance(e, ValidationError):
                    raise
                raise ValidationError({"public_key": "Invalid base64 encoding."}) from e
            self.public_serial_number = public_key_fingerprint(self.public_key)
        if not self.private_serial_number:
            # Only legacy HMAC boards use it; unique, so never leave it blank.
            self.private_serial_number = secrets.token_hex(16)

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

    def __str__(self):
        return f"Token for frame {self.frame_id}"

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

    def __str__(self):
        return f"OTP for frame {self.frame_id}"

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

    def __str__(self):
        return f"Connection for frame {self.frame_id}"


class FrameCommand(models.Model):
    """Remote command sent to one frame from the admin. The table is the audit trail."""

    class Status(models.TextChoices):
        SENT = "sent"
        ACCEPTED = "accepted"
        REJECTED = "rejected"
        DONE = "done"
        FAILED = "failed"
        EXPIRED = "expired"

    frame = models.ForeignKey(Frame, on_delete=models.CASCADE, related_name="commands")
    command = models.CharField(max_length=50)
    arg = models.CharField(max_length=50, blank=True)
    tier = models.CharField(max_length=10)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.SENT
    )
    reason = models.TextField(blank=True)
    result = models.JSONField(null=True, blank=True)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ("-created_at",)
        permissions = (
            ("send_frame_command", "Can send read and safe remote commands to frames"),
            ("send_risky_frame_command", "Can send risky remote commands to frames"),
        )

    def __str__(self):
        return f"#{self.pk} {self.command} {self.arg} → {self.frame_id} ({self.status})".replace(
            "  ", " "
        )


def frame_diagnostics_upload_path(instance, filename):
    return f"frame-diagnostics/{instance.frame.public_serial_number}/{uuid.uuid4()}.gz"


class FrameDiagnostics(models.Model):
    class Trigger(models.TextChoices):
        OWNER = "owner"
        ADMIN = "admin"
        PRE_REBOOT = "pre-reboot"

    frame = models.ForeignKey(
        Frame, on_delete=models.CASCADE, related_name="diagnostics"
    )
    command = models.ForeignKey(
        FrameCommand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="diagnostics",
    )
    trigger = models.CharField(max_length=20, choices=Trigger.choices)
    file = models.FileField(upload_to=frame_diagnostics_upload_path)
    size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name_plural = "frame diagnostics"

    def __str__(self):
        return f"Diagnostics {self.frame_id} {self.created_at:%Y-%m-%d %H:%M} ({self.trigger})"


@receiver(post_delete, sender=FrameDiagnostics)
def delete_frame_diagnostics_file(sender, instance, **kwargs):
    instance.file.delete(save=False)
