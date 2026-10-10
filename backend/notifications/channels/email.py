import logging
import os

from django.conf import settings

from appEmail.tasks import send_django_mail_with_logo

from ..choices import NotificationChannel
from ..unsubscribe import make_token
from .base import Channel

logger = logging.getLogger(__name__)


def preview_address(user):
    return settings.ADMIN_NOTIFICATION_EMAIL if user.is_admin else user.email


class EmailChannel(Channel):
    def is_available(self, account):
        user = account.user
        return user.is_active and not user.is_deleted and bool(user.email)

    def send(self, account, kind, message, *, preview=False):
        base_url = os.environ.get("FRONTEND_BASE_URL")
        context = {
            "subject": f"ShareFrame - {message.title}",
            "title": message.title,
            "body": message.body,
            "cta_label": message.cta_label,
            "cta_link": base_url + message.url,
            "settings_link": base_url + settings.FRONTEND_NOTIFICATION_SETTINGS_URL,
            "unsubscribe_link": "",
            **message.email_context,
        }
        headers = None
        if not preview:
            token = make_token(account, kind, NotificationChannel.EMAIL)
            context["unsubscribe_link"] = (
                f"{base_url}{settings.FRONTEND_UNSUBSCRIBE_URL}{token}/"
            )
            headers = {"List-Unsubscribe": f"<{context['unsubscribe_link']}>"}

        try:
            send_django_mail_with_logo(
                template_name=message.email_template,
                context=context,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=[
                    preview_address(account.user) if preview else account.user.email
                ],
                images=list(message.email_images),
                headers=headers,
            )
            return True
        except Exception:
            logger.exception(
                "Notification mail %s to account %s failed", kind, account.pk
            )
            return False
