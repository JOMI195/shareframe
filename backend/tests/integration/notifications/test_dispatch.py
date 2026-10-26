import email.policy
import json
import os
from dataclasses import replace

import pytest
from django.core import mail
from pywebpush import WebPushException

from notifications.choices import NotificationChannel, NotificationKind
from notifications.dispatch import notify, preview
from notifications.models import Notification, PushSubscription
from tests.support.helpers.mail import html_of
from tests.support.helpers.notifications import set_preference

pytestmark = pytest.mark.django_db

KIND = NotificationKind.INACTIVITY_REMINDER
EMAIL = NotificationChannel.EMAIL
PUSH = NotificationChannel.PUSH


def test_nothing_is_sent_while_the_admin_has_not_enabled_a_channel(
    account, subscribe, webpush, message
):
    subscribe(account)

    assert notify(account, KIND, message) == []
    assert mail.outbox == []
    assert webpush == []
    assert not Notification.objects.filter(account=account).exists()


def test_every_enabled_channel_delivers_and_is_logged(
    account, enable, subscribe, webpush, message
):
    enable(EMAIL, PUSH)
    subscribe(account)

    assert notify(account, KIND, message) == [PUSH, EMAIL]
    assert len(mail.outbox) == 1
    assert len(webpush) == 1
    assert set(
        Notification.objects.filter(account=account).values_list("channel", flat=True)
    ) == {PUSH, EMAIL}


def test_an_opted_out_channel_is_skipped(account, enable, message):
    enable(EMAIL)
    set_preference(account, KIND, EMAIL, enabled=False)

    assert notify(account, KIND, message) == []
    assert mail.outbox == []


def test_push_is_skipped_without_a_subscription(account, enable, webpush, message):
    enable(PUSH)

    assert notify(account, KIND, message) == []
    assert webpush == []


def test_push_reaches_every_subscription_with_the_payload(
    account, enable, subscribe, webpush, message
):
    enable(PUSH)
    subscribe(account, "https://push.example.com/one")
    subscribe(account, "https://push.example.com/two")

    notify(account, KIND, message)

    assert len(webpush) == 2
    assert json.loads(webpush[0]["data"]) == {
        "title": "Hallo",
        "body": "Text",
        "url": "/fotos/",
        "tag": KIND,
    }


def test_a_gone_subscription_is_deleted(
    account, enable, subscribe, monkeypatch, settings, message
):
    settings.VAPID_PRIVATE_KEY = "private"
    enable(PUSH)
    subscription = subscribe(account)

    def gone(**kwargs):
        raise WebPushException("gone", response=type("R", (), {"status_code": 410})())

    monkeypatch.setattr("notifications.channels.push.webpush", gone)

    assert notify(account, KIND, message) == []
    assert not PushSubscription.objects.filter(pk=subscription.pk).exists()
    assert not Notification.objects.filter(account=account).exists()


def test_the_mail_carries_message_and_unsubscribe_link(
    account, enable, settings, message
):
    enable(EMAIL)

    notify(account, KIND, message)

    sent = mail.outbox[-1]
    assert sent.to == [account.user.email]
    assert sent.subject == "ShareFrame - Hallo"
    assert "Text" in sent.body
    assert settings.FRONTEND_UNSUBSCRIBE_URL in sent.body
    assert sent.extra_headers["List-Unsubscribe"].startswith(
        f"<{os.environ['BACKEND_BASE_URL']}api/notifications/unsubscribe/one-click/?token="
    )
    assert sent.extra_headers["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"
    assert settings.FRONTEND_NOTIFICATION_SETTINGS_URL in sent.body


def test_the_unsubscribe_header_survives_serialisation_as_a_plain_url(
    account, enable, message
):
    """Folded into encoded words, mail clients no longer see a link."""
    enable(EMAIL)

    notify(account, KIND, message)

    # Serialised the way the SMTP backend does it.
    raw = mail.outbox[-1].message(policy=email.policy.SMTP).as_bytes()
    url = mail.outbox[-1].extra_headers["List-Unsubscribe"]
    assert f"List-Unsubscribe: {url}\r\n".encode() in raw
    assert b"List-Unsubscribe-Post: List-Unsubscribe=One-Click\r\n" in raw


def test_an_inactive_user_gets_no_mail(account, enable, message):
    enable(EMAIL)
    account.user.is_active = False
    account.user.save()

    assert notify(account, KIND, message) == []


def test_a_kind_turned_off_blocks_every_channel(
    account, enable, subscribe, webpush, message
):
    enable(EMAIL, PUSH)
    subscribe(account)
    set_preference(account, KIND, enabled=False)

    assert notify(account, KIND, message) == []
    assert mail.outbox == []
    assert webpush == []


def test_a_custom_mail_template_gets_its_context(account, enable, message):
    enable(EMAIL)
    rich = replace(
        message,
        email_template="changelogs/changelog_email.html",
        email_context={"date": "01.10.2026", "content_html": "<em>neu</em>"},
    )

    notify(account, KIND, rich)

    assert "<em>neu</em>" in html_of(mail.outbox[-1])
    assert "01.10.2026" in mail.outbox[-1].body


class TestPreview:
    def test_ignores_switches_and_opt_outs(self, account, subscribe, webpush, message):
        subscribe(account)
        set_preference(account, KIND, enabled=False)

        assert preview(account, KIND, message) == [PUSH, EMAIL]
        assert len(webpush) == 1
        assert len(mail.outbox) == 1

    def test_is_not_logged(self, account, message):
        preview(account, KIND, message)

        assert not Notification.objects.filter(account=account).exists()
