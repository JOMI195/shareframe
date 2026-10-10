from notifications.choices import NotificationChannel, NotificationKind

from .models import NotificationKindPreference, NotificationPreference


def create_notification_preferences(accounts, enabled):
    """Add every missing kind and channel row; existing rows keep their value."""
    NotificationKindPreference.objects.bulk_create(
        [
            NotificationKindPreference(account=account, kind=kind, enabled=enabled)
            for account in accounts
            for kind in NotificationKind.values
        ],
        ignore_conflicts=True,
    )
    NotificationPreference.objects.bulk_create(
        [
            NotificationPreference(
                account=account, kind=kind, channel=channel, enabled=enabled
            )
            for account in accounts
            for kind in NotificationKind.values
            for channel in NotificationChannel.values
        ],
        ignore_conflicts=True,
    )
