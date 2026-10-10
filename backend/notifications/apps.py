from django.apps import AppConfig
from django.db.models.signals import post_migrate


def ensure_channel_settings(sender, **kwargs):
    from .choices import NotificationChannel, NotificationKind
    from .models import ChannelSetting

    for kind in NotificationKind.values:
        for channel in NotificationChannel.values:
            ChannelSetting.objects.get_or_create(kind=kind, channel=channel)


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        post_migrate.connect(ensure_channel_settings, sender=self)
