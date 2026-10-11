from django.conf import settings
from django.db import models
from django.utils import timezone

from images.models import Image


class SentImageStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Scheduled"
    SENT = "sent", "Sent"


class SentImageQuerySet(models.QuerySet):
    def sent(self):
        return self.filter(status=SentImageStatus.SENT)

    def scheduled(self):
        return self.filter(status=SentImageStatus.SCHEDULED)

    def due(self):
        return self.scheduled().filter(scheduled_for__lte=timezone.now())


class SentImage(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="image_sender",
        on_delete=models.CASCADE,
    )

    reciever = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="image_reciever",
        on_delete=models.CASCADE,
    )

    image = models.ForeignKey(
        Image,
        related_name="sent_image",
        on_delete=models.CASCADE,
    )

    status = models.CharField(
        max_length=16,
        choices=SentImageStatus.choices,
        default=SentImageStatus.SENT,
    )

    scheduled_for = models.DateTimeField(null=True, blank=True)

    expires_at = models.DateTimeField(null=True, blank=True)

    sent_at = models.DateTimeField(default=timezone.now)

    objects = SentImageQuerySet.as_manager()

    def __str__(self):
        return f"{self.sender.username}->{self.reciever.username}"
