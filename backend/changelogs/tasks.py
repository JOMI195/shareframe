import logging
import os

from django.conf import settings
from django.contrib.auth import get_user_model

from appEmail.tasks import send_django_mail_with_logo
from config.celery import celery

from .email import render_email_html
from .models import Changelog

logger = logging.getLogger(__name__)


@celery.task
def send_changelog_email(changelog_id: int, user_ids: list[int]) -> None:
    changelog = Changelog.objects.get(pk=changelog_id)
    content_html, images = render_email_html(changelog)
    context = {
        "subject": f"ShareFrame - {changelog.title}",
        "title": changelog.title,
        "date": changelog.date.strftime("%d.%m.%Y"),
        "content_html": content_html,
        "changelogs_link": os.environ.get("FRONTEND_BASE_URL")
        + settings.FRONTEND_CHANGELOGS_URL,
    }

    # One mail per user so recipients never see each other's addresses.
    for user in get_user_model().objects.filter(pk__in=user_ids):
        try:
            send_django_mail_with_logo(
                template_name="changelogs/changelog_email.html",
                context=dict(context),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=[user.email],
                images=images,
            )
        except Exception:
            logger.exception(
                "Changelog %s email to %s failed", changelog_id, user.email
            )
