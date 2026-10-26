import os
import re

import pytest
from django.core import mail
from django.test import RequestFactory

from appEmail.djoserEmailConfig import (
    DjoserActivationEmail,
    DjoserConfirmationEmail,
    DjoserEmailChangeConfirmEmail,
    DjoserEmailChangedEmail,
    DjoserPasswordChangedConfirmationEmail,
    DjoserPasswordResetEmail,
    DjoserUserDeletedEmail,
)
from tests.support.factories import UserFactory

pytestmark = pytest.mark.django_db

CLASSES = [
    DjoserActivationEmail,
    DjoserConfirmationEmail,
    DjoserPasswordResetEmail,
    DjoserPasswordChangedConfirmationEmail,
    DjoserUserDeletedEmail,
    DjoserEmailChangeConfirmEmail,
    DjoserEmailChangedEmail,
]


@pytest.fixture
def user():
    return UserFactory(is_active=True)


def send(email_class, user):
    request = RequestFactory().get("/")
    email_class(
        request, {"user": user, "new_email": "new@example.com", "token": "tok-en"}
    ).send([user.email])
    return mail.outbox[-1]


@pytest.mark.parametrize("email_class", CLASSES)
def test_each_mail_reaches_the_user(email_class, user):
    message = send(email_class, user)

    assert message.to == [user.email]


@pytest.mark.parametrize("email_class", CLASSES)
def test_each_mail_carries_a_german_subject(email_class, user):
    message = send(email_class, user)

    assert message.subject
    assert message.subject != message.body


EMOJI = re.compile("[\U0001f300-\U0001faff\u2600-\u27bf\ufe0f]")


@pytest.mark.parametrize("email_class", CLASSES)
def test_each_mail_is_free_of_emojis(email_class, user):
    message = send(email_class, user)

    assert not EMOJI.search(message.subject)
    assert not EMOJI.search(message.body)


@pytest.mark.parametrize("email_class", CLASSES)
def test_each_mail_is_html_with_the_inline_logo(email_class, user):
    message = send(email_class, user)

    assert message.content_subtype == "html"
    assert message.attachments[0]["Content-ID"] == "<logo_image>"


def test_the_activation_mail_carries_the_confirmation_link(user):
    message = send(DjoserActivationEmail, user)

    assert "activate" in message.body or "aktiv" in message.body.lower()


def test_the_email_change_mail_carries_the_confirmation_link(user):
    message = send(DjoserEmailChangeConfirmEmail, user)

    assert "auth/users/email-change/tok-en" in message.body
    assert "new@example.com" in message.body


@pytest.mark.parametrize(
    "email_class", [DjoserPasswordChangedConfirmationEmail, DjoserEmailChangedEmail]
)
def test_the_support_button_leads_to_the_contact_page(email_class, user, settings):
    message = send(email_class, user)

    assert (
        f'href="{os.environ["FRONTEND_BASE_URL"]}{settings.FRONTEND_CONTACT_URL}" class="button"'
        in message.body
    )
