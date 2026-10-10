from django.db import models

from user_accounts.models import Account

from .choices import NotificationChannel, NotificationKind


class ChannelSetting(models.Model):
    kind = models.CharField(max_length=50, choices=NotificationKind.choices)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    enabled = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["kind", "channel"], name="unique_channel_setting"
            )
        ]
        ordering = ["kind", "channel"]

    def __str__(self):
        return f"{self.kind} / {self.channel}"

    @classmethod
    def enabled_pairs(cls):
        return set(cls.objects.filter(enabled=True).values_list("kind", "channel"))


class PushSubscription(models.Model):
    account = models.ForeignKey(
        Account, related_name="push_subscriptions", on_delete=models.CASCADE
    )
    endpoint = models.URLField(max_length=1000, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.account} - {self.endpoint[:50]}"


class Notification(models.Model):
    account = models.ForeignKey(
        Account, related_name="notifications", on_delete=models.CASCADE
    )
    kind = models.CharField(max_length=50, choices=NotificationKind.choices)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["account", "kind", "sent_at"])]
        ordering = ["-sent_at"]

    def __str__(self):
        return f"{self.account} - {self.kind} via {self.channel}"
