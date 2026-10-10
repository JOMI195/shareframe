from user_accounts.models import NotificationKindPreference, NotificationPreference

from .channels.registry import CHANNELS
from .models import ChannelSetting, Notification


def notify(account, kind, message):
    """Send over every channel that admin and account allow; return the ones that delivered."""
    if not NotificationKindPreference.is_enabled(account, kind):
        return []

    enabled = ChannelSetting.enabled_pairs()
    delivered = []
    for channel_name, channel in CHANNELS.items():
        if (kind, channel_name) not in enabled:
            continue
        if not NotificationPreference.is_enabled(account, kind, channel_name):
            continue
        if not channel.is_available(account) or not channel.send(
            account, kind, message
        ):
            continue
        Notification.objects.create(account=account, kind=kind, channel=channel_name)
        delivered.append(channel_name)
    return delivered


def preview(account, kind, message):
    """Admin preview over every available channel, ignoring switches and opt-outs; not logged."""
    return [
        channel_name
        for channel_name, channel in CHANNELS.items()
        if channel.is_available(account)
        and channel.send(account, kind, message, preview=True)
    ]
