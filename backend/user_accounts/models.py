import uuid

from django.conf import settings
from django.db import models

from notifications.choices import NotificationChannel, NotificationKind


class AccountManager(models.Manager):
    def create_account(self, user, **extra_fields):
        while True:
            search_code = str(uuid.uuid4())[:8].upper()

            if not self.model.objects.filter(
                friendship_user_search_code=search_code
            ).exists():
                break

        account = self.model(
            user=user, friendship_user_search_code=search_code, **extra_fields
        )
        account.save(using=self._db)
        return account


def avatar_upload_path(instance, filename):
    return f"avatars/{uuid.uuid4().hex}.jpg"


class Account(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        primary_key=True,
        related_name="account",
        on_delete=models.CASCADE,
    )
    friendship_user_searchable = models.BooleanField(default=True)
    friendship_user_search_code = models.CharField(max_length=100, unique=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True)

    objects = AccountManager()

    def __str__(self):
        return self.user.email


class NotificationPreference(models.Model):
    account = models.ForeignKey(
        Account, related_name="notification_preferences", on_delete=models.CASCADE
    )
    kind = models.CharField(max_length=50, choices=NotificationKind.choices)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    enabled = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["account", "kind", "channel"],
                name="unique_notification_preference",
            )
        ]

    def __str__(self):
        return f"{self.account} - {self.kind} / {self.channel}"

    @classmethod
    def is_enabled(cls, account, kind, channel):
        preference = cls.objects.filter(
            account=account, kind=kind, channel=channel
        ).first()
        return preference is not None and preference.enabled


class NotificationKindPreference(models.Model):
    account = models.ForeignKey(
        Account, related_name="notification_kind_preferences", on_delete=models.CASCADE
    )
    kind = models.CharField(max_length=50, choices=NotificationKind.choices)
    enabled = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["account", "kind"], name="unique_notification_kind_preference"
            )
        ]

    def __str__(self):
        return f"{self.account} - {self.kind}"

    @classmethod
    def is_enabled(cls, account, kind):
        preference = cls.objects.filter(account=account, kind=kind).first()
        return preference is not None and preference.enabled
