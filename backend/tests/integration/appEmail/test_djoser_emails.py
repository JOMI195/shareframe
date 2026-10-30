import json
import logging
import os
import re
from unittest.mock import patch

import pytest
from celery.exceptions import Retry
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
from tests.support.helpers.mail import break_delivery, html_of

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


@pytest.mark.parametrize(
    "email_class,subject",
    [
        (DjoserActivationEmail, "ShareFrame - Konto aktivieren"),
        (DjoserConfirmationEmail, "ShareFrame - Konto aktiviert"),
        (DjoserPasswordResetEmail, "ShareFrame - Passwort zurücksetzen"),
        (DjoserPasswordChangedConfirmationEmail, "ShareFrame - Passwort geändert"),
        (DjoserUserDeletedEmail, "ShareFrame - Konto gelöscht"),
        (DjoserEmailChangeConfirmEmail, "ShareFrame - Neue E-Mail-Adresse bestätigen"),
        (DjoserEmailChangedEmail, "ShareFrame - E-Mail-Adresse geändert"),
    ],
)
def test_each_mail_carries_its_subject(email_class, subject, user):
    assert send(email_class, user).subject == subject


@pytest.mark.parametrize(
    "email_class,path",
    [
        (DjoserActivationEmail, "auth/users/activate/"),
        (DjoserPasswordResetEmail, "auth/users/password-reset/"),
        (DjoserEmailChangeConfirmEmail, "auth/users/email-change/"),
    ],
)
def test_links_lead_to_the_frontend_not_the_api_host(email_class, path, user):
    message = send(email_class, user)

    assert f'href="{os.environ["FRONTEND_BASE_URL"]}{path}' in html_of(message)
    assert f"{os.environ['FRONTEND_BASE_URL']}{path}" in message.body


@pytest.mark.parametrize(
    "email_class",
    [
        DjoserConfirmationEmail,
        DjoserPasswordChangedConfirmationEmail,
        DjoserUserDeletedEmail,
        DjoserEmailChangedEmail,
    ],
)
def test_a_failed_notice_is_logged_not_raised(email_class, user, monkeypatch, caplog):
    break_delivery(monkeypatch)

    with caplog.at_level(logging.ERROR, logger="appEmail.djoserEmailConfig"):
        email_class(RequestFactory().get("/"), {"user": user}).send([user.email])

    assert "Notice mail" in caplog.text


@pytest.mark.parametrize(
    "email_class",
    [DjoserActivationEmail, DjoserPasswordResetEmail, DjoserEmailChangeConfirmEmail],
)
def test_a_failed_link_mail_is_retried(email_class, user, monkeypatch):
    break_delivery(monkeypatch)

    with pytest.raises(Retry):
        email_class(RequestFactory().get("/"), {"user": user, "token": "tok-en"}).send(
            [user.email]
        )


EMOJI = re.compile("[\U0001f300-\U0001faff\u2600-\u27bf\ufe0f]")


@pytest.mark.parametrize("email_class", CLASSES)
def test_each_mail_is_free_of_emojis(email_class, user):
    message = send(email_class, user)

    assert not EMOJI.search(message.subject)
    assert not EMOJI.search(message.body)


# Account mails must always arrive, so they offer no way to unsubscribe.
@pytest.mark.parametrize("email_class", CLASSES)
def test_no_account_mail_can_be_unsubscribed(email_class, user):
    message = send(email_class, user)

    assert "List-Unsubscribe" not in message.extra_headers
    assert "List-Unsubscribe-Post" not in message.extra_headers


@pytest.mark.parametrize("email_class", CLASSES)
def test_each_mail_is_html_with_the_inline_logo(email_class, user):
    message = send(email_class, user)

    assert "cid:logo_image" in html_of(message)
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
        in html_of(message)
    )


# The worker needs a JSON context, and tokens must not land in the result backend.
@pytest.mark.parametrize("email_class", CLASSES)
def test_mails_are_queued_with_a_json_context_and_a_redacted_repr(email_class, user):
    with patch("appEmail.djoserEmailConfig.send_account_mail.apply_async") as queue:
        email_class(RequestFactory().get("/"), {"user": user, "token": "tok-en"}).send(
            [user.email]
        )

    kwargs = queue.call_args.kwargs
    assert json.loads(json.dumps(kwargs["kwargs"]["context"]))["user"] == {
        "username": user.username
    }
    assert "tok-en" not in kwargs["kwargsrepr"]
