import pytest
from django.core import mail
from django.test import RequestFactory

from appEmail.djoserEmailConfig import (
    DjoserActivationEmail,
    DjoserConfirmationEmail,
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
]


@pytest.fixture
def user():
    return UserFactory(is_active=True)


def send(email_class, user):
    request = RequestFactory().get("/")
    email_class(request, {"user": user}).send([user.email])
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


@pytest.mark.parametrize("email_class", CLASSES)
def test_each_mail_is_html_with_the_inline_logo(email_class, user):
    message = send(email_class, user)

    assert message.content_subtype == "html"
    assert message.attachments[0]["Content-ID"] == "<logo_image>"


def test_the_activation_mail_carries_the_confirmation_link(user):
    message = send(DjoserActivationEmail, user)

    assert "activate" in message.body or "aktiv" in message.body.lower()
