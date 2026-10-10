from notifications.models import ChannelSetting, PushSubscription
from user_accounts.models import NotificationKindPreference, NotificationPreference


def enable_channels(kind, *channels):
    ChannelSetting.objects.filter(kind=kind, channel__in=channels).update(enabled=True)


def subscribe_push(account, endpoint="https://push.example.com/abc"):
    return PushSubscription.objects.create(
        account=account, endpoint=endpoint, p256dh="key", auth="secret"
    )


def set_preference(account, kind, channel=None, *, enabled):
    """Flip the general toggle of a kind, or one of its channels."""
    if channel is None:
        NotificationKindPreference.objects.filter(account=account, kind=kind).update(
            enabled=enabled
        )
    else:
        NotificationPreference.objects.filter(
            account=account, kind=kind, channel=channel
        ).update(enabled=enabled)
