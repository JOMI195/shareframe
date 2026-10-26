import mimetypes
import os
from email.message import MIMEPart
from email.policy import default as default_policy

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from config.celery import celery

from .text import html_to_text


class _EmailMessage(EmailMultiAlternatives):
    # RFC 5322 allows 998; folding at 78 turns a long List-Unsubscribe URL into
    # encoded words, which mail clients do not read as a link. The SMTP backend
    # passes its own policy, so only the line length is changed.
    def message(self, *, policy=default_policy):
        return super().message(policy=policy.clone(max_line_length=998))


def send_django_mail(
    template_name: str,
    context: dict[str, any],
    from_email: str,
    to_emails: list[str],
    images: list[dict[str, str]],
    headers: dict[str, str] | None = None,
) -> None:
    """
    Send an HTML email using the provided template and context, with attached images.

    Args:
        template_name (str): The name of the email template.
        context (dict): A dictionary containing the context variables for the template.
        from_email (str): The email address to use as the sender.
        to_email (str): The email address to send the email to.
        images (list[dict]): A list of dictionaries, where each dictionary contains the following keys:
            - path (str): The file path to the image.
            - cid (str): The Content-ID to use for the image.
            - template_identifier (str): The identifier for the image in the template.
            - filename (str): The desired filename for the attachment.
    """
    context["contact_link"] = (
        os.environ.get("FRONTEND_BASE_URL") + settings.FRONTEND_CONTACT_URL
    )

    for image in images:
        context[image["template_identifier"]] = image["cid"]

    html_message = render_to_string(template_name, context)

    email = _EmailMessage(
        subject=context["subject"],
        body=html_to_text(html_message),
        from_email=from_email,
        to=to_emails,
        headers=headers,
    )
    email.attach_alternative(html_message, "text/html")

    for image in images:
        with open(image["path"], "rb") as f:
            maintype, subtype = mimetypes.guess_type(image["path"])[0].split("/")
            part = MIMEPart()
            part.set_content(
                f.read(),
                maintype=maintype,
                subtype=subtype,
                disposition="inline",
                filename=image["filename"],
                cid=f"<{image['cid']}>",
            )
            email.attach(part)

    email.send(fail_silently=False)


@celery.task
def send_django_mail_with_logo(
    template_name: str,
    context: dict[str, any],
    from_email: str,
    to_emails: list[str],
    images: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> None:
    """
    Send an HTML email using the provided template and context, with attached images.

    Args:
        template_name (str): The name of the email template.
        context (dict): A dictionary containing the context variables for the template.
        from_email (str): The email address to use as the sender.
        to_email (str): The email address to send the email to.
        images (list[dict]): A list of dictionaries, where each dictionary contains the following keys:
            - path (str): The file path to the image.
            - cid (str): The Content-ID to use for the image.
            - template_identifier (str): The identifier for the image in the template.
            - filename (str): The desired filename for the attachment.
    """
    send_django_mail(
        template_name=template_name,
        context=context,
        from_email=from_email,
        to_emails=to_emails,
        images=[
            {
                "path": os.path.join(
                    settings.BASE_DIR,
                    "mediafiles",
                    "brand",
                    "logo-email-light-full-shareframe.png",
                ),
                "cid": "logo_image",
                "template_identifier": "logo_image_cid",
                "filename": "shareframe-logo.png",
            }
        ]
        + (images or []),
        headers=headers,
    )
