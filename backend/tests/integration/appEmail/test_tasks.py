from django.core import mail

from appEmail.tasks import send_django_mail, send_django_mail_with_logo

TEMPLATE = "authentication/login.html"
CONTEXT = {
    "subject": "ShareFrame Login",
    "user_email": "someone@shareframe.local",
    "ip_address": "203.0.113.5",
    "timestamp": "01.01.2026 12:00:00",
}


def send(**overrides):
    send_django_mail_with_logo(
        template_name=TEMPLATE,
        context={**CONTEXT, **overrides},
        from_email="noreply@shareframe.local",
        to_emails=["someone@shareframe.local"],
    )
    return mail.outbox[-1]


def test_sends_one_html_message():
    message = send()

    assert message.subject == CONTEXT["subject"]
    assert message.to == ["someone@shareframe.local"]
    assert message.content_subtype == "html"


def test_the_body_carries_the_context():
    message = send()

    assert CONTEXT["ip_address"] in message.body


def test_the_logo_is_attached_inline():
    message = send()

    assert len(message.attachments) == 1
    assert message.attachments[0]["Content-ID"] == "<logo_image>"


def test_the_template_references_the_attachment_by_cid():
    message = send()

    assert "cid:logo_image" in message.body


def test_the_contact_link_is_built_from_the_frontend_url(settings):
    send_django_mail(
        template_name=TEMPLATE,
        context=dict(CONTEXT),
        from_email="noreply@shareframe.local",
        to_emails=["someone@shareframe.local"],
        images=[],
    )

    assert settings.FRONTEND_CONTACT_URL in mail.outbox[-1].body


def test_extra_images_are_attached_next_to_the_logo(tmp_path):
    from tests.support.helpers.images import image_bytes

    extra = tmp_path / "extra.png"
    extra.write_bytes(image_bytes())

    send_django_mail_with_logo(
        template_name=TEMPLATE,
        context=dict(CONTEXT),
        from_email="noreply@shareframe.local",
        to_emails=["someone@shareframe.local"],
        images=[
            {
                "path": str(extra),
                "cid": "extra_image",
                "template_identifier": "extra_image_cid",
                "filename": "extra.png",
            }
        ],
    )

    assert len(mail.outbox[-1].attachments) == 2
