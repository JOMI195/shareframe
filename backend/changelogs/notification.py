import os

from django.conf import settings

from notifications.message import Message

from .email import render_email_html


def build_message(changelog):
    content_html, images = render_email_html(changelog)
    changelogs_link = (
        os.environ.get("FRONTEND_BASE_URL") + settings.FRONTEND_CHANGELOGS_URL
    )
    date = changelog.date.strftime("%d.%m.%Y")
    return Message(
        title=changelog.title,
        body=f"Neue Änderungen vom {date}. Schau dir an, was neu ist.",
        url=settings.FRONTEND_CHANGELOGS_URL,
        cta_label="Alle Änderungen ansehen",
        email_template="changelogs/changelog_email.html",
        email_context={
            "date": date,
            "content_html": content_html,
            "changelogs_link": changelogs_link,
        },
        email_images=images,
    )
