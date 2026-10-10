from django.utils import timezone

from notifications.choices import NotificationKind
from notifications.models import ChannelSetting

from .models import Changelog
from .tasks import notify_changelog


def notify_when_published(changelog):
    """Queue the notifications once per published changelog; returns why it did not, or None."""
    if not changelog.is_published or changelog.notified_at:
        return "not due"
    if not any(
        kind == NotificationKind.CHANGELOG for kind, _ in ChannelSetting.enabled_pairs()
    ):
        return "no channel enabled in Channel settings"
    if not changelog.recipients().exists():
        return "no recipients"

    # Conditional update so concurrent saves notify only once.
    claimed = Changelog.objects.filter(
        pk=changelog.pk, notified_at__isnull=True
    ).update(notified_at=timezone.now())
    if not claimed:
        return "not due"
    notify_changelog.delay(changelog.pk)
    return None
