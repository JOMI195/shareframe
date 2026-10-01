import mimetypes
import os
from email.message import MIMEPart

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string

from config.celery import celery


def send_django_mail(
    template_name: str,
    context: dict[str, any],
    from_email: str,
    to_emails: list[str],
    images: list[dict[str, str]],
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

    email = EmailMessage(
        subject=context["subject"],
        body=html_message,
        from_email=from_email,
        to=to_emails,
    )
    email.content_subtype = "html"

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
    )
