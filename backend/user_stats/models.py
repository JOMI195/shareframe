from django.conf import settings
from django.db import models


class UserStats(models.Model):
    # Survives account deletion so totals keep counting it.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stats",
    )
    images_uploaded = models.PositiveIntegerField(default=0)
    images_sent = models.PositiveIntegerField(default=0)
    images_received = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    COUNTERS = ("images_uploaded", "images_sent", "images_received")

    class Meta:
        verbose_name = "user stats"
        verbose_name_plural = "user stats"

    def __str__(self):
        return self.user.username if self.user else "deleted user"
