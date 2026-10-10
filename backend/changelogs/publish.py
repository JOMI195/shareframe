from django.utils import timezone

from notifications.choices import NotificationKind
from notifications.models import ChannelSetting

from .models import Changelog
from .tasks import notify_changelog


def skip_reason(changelog):
    if changelog.notified_at:
        return f"already notified on {timezone.localtime(changelog.notified_at):%d.%m.%Y %H:%M}"
    if not changelog.is_published:
        return "not published"
    if not any(
        kind == NotificationKind.CHANGELOG for kind, _ in ChannelSetting.enabled_pairs()
    ):
        return "no channel enabled in Channel settings"
    if not changelog.recipients().exists():
        return "no recipients"
    return None


def notify_group_members(changelog):
    """Queue the notifications once per changelog; returns whether this call queued them."""
    # Conditional update so concurrent runs notify only once.
    claimed = Changelog.objects.filter(
        pk=changelog.pk, notified_at__isnull=True
    ).update(notified_at=timezone.now())
    if claimed:
        notify_changelog.delay(changelog.pk)
    return bool(claimed)
