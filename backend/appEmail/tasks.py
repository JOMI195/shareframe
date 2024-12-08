from typing import List, Dict, Tuple
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from email.mime.image import MIMEImage
import os
from django.conf import settings
from config.celery import celery


def send_django_mail(
    template_name: str,
    context: Dict[str, any],
    from_email: str,
    to_emails: List[str],
    images: List[Dict[str, str]],
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
            img = MIMEImage(f.read())
            img.add_header("Content-ID", f"<{image['cid']}>")
            img.add_header("Content-Disposition", "inline", filename=image["filename"])
            email.attach(img)

    email.send(fail_silently=False)


@celery.task
def send_django_mail_with_logo(
    template_name: str,
    context: Dict[str, any],
    from_email: str,
    to_emails: List[str],
    images: List[Dict[str, str]] = [],
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
                    "witz-des-tages-logo-light-full.png",
                ),
                "cid": "logo_image",
                "template_identifier": "logo_image_cid",
                "filename": "witz-des-tages-logo.png",
            }
        ]
        + images,
    )
