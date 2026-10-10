import logging

from config.celery import celery
from notifications.choices import NotificationKind
from notifications.dispatch import notify, preview
from user_core.models import User

from .models import Changelog
from .notification import build_message

logger = logging.getLogger(__name__)


@celery.task
def notify_changelog(changelog_id: int) -> int:
    changelog = Changelog.objects.get(pk=changelog_id)
    message = build_message(changelog)
    notified = 0
    for user in changelog.recipients().select_related("account"):
        try:
            notified += bool(notify(user.account, NotificationKind.CHANGELOG, message))
        except Exception:
            logger.exception("Changelog %s to user %s failed", changelog_id, user.pk)
    return notified


@celery.task
def notify_changelog_test(changelog_id: int, user_id: int) -> list[str]:
    changelog = Changelog.objects.get(pk=changelog_id)
    account = User.objects.get(pk=user_id).account
    return preview(account, NotificationKind.CHANGELOG, build_message(changelog))
