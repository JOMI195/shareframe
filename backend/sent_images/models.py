from django.db import models
from django.conf import settings

from images.models import Image


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

    expires_at = models.DateTimeField(null=True, blank=True)

    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}->{self.reciever.username}"
