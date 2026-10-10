from datetime import timedelta

from django.conf import settings
from django.db.models import F, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone

from sent_images.models import SentImage
from user_accounts.models import Account

from ..choices import NotificationKind
from ..dispatch import notify
from ..message import Message
from ..models import Notification

INACTIVITY_DAYS = 21

MESSAGE = Message(
    title="Lange kein Foto mehr geteilt",
    body=(
        "Du hast seit drei Wochen kein Foto mehr verschickt. "
        "Teile doch mal wieder einen Moment mit deinen Liebsten."
    ),
    url=settings.FRONTEND_IMAGES_URL,
    cta_label="Foto teilen",
)


def due_accounts(now=None):
    """Accounts inactive for INACTIVITY_DAYS and not reminded since their last send."""
    now = now or timezone.now()
    last_sent = SentImage.objects.filter(sender=OuterRef("user")).order_by("-sent_at")
    last_reminder = Notification.objects.filter(
        account=OuterRef("pk"), kind=NotificationKind.INACTIVITY_REMINDER
    ).order_by("-sent_at")
    return (
        Account.objects.filter(user__is_active=True, user__is_deleted=False)
        .annotate(
            last_activity=Coalesce(
                Subquery(last_sent.values("sent_at")[:1]), "user__date_joined"
            ),
            last_reminder=Subquery(last_reminder.values("sent_at")[:1]),
        )
        .filter(last_activity__lt=now - timedelta(days=INACTIVITY_DAYS))
        .filter(Q(last_reminder__isnull=True) | Q(last_reminder__lt=F("last_activity")))
        .select_related("user")
    )


def send_reminders():
    return sum(
        bool(notify(account, NotificationKind.INACTIVITY_REMINDER, MESSAGE))
        for account in due_accounts()
    )
