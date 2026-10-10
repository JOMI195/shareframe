import pytest

from notifications.choices import NotificationKind
from notifications.message import Message
from notifications.models import ChannelSetting, PushSubscription
from tests.support.factories import UserFactory


@pytest.fixture
def enable():
    def _enable(*channels, kind=NotificationKind.INACTIVITY_REMINDER):
        ChannelSetting.objects.filter(kind=kind, channel__in=channels).update(
            enabled=True
        )

    return _enable


@pytest.fixture
def account():
    return UserFactory(is_active=True).account


@pytest.fixture
def subscribe():
    def _subscribe(account, endpoint="https://push.example.com/abc"):
        return PushSubscription.objects.create(
            account=account, endpoint=endpoint, p256dh="key", auth="secret"
        )

    return _subscribe


@pytest.fixture
def message():
    return Message(title="Hallo", body="Text", url="fotos/", cta_label="Los")


@pytest.fixture
def webpush(monkeypatch, settings):
    settings.VAPID_PRIVATE_KEY = "private"
    settings.VAPID_SUBJECT = "mailto:dev@shareframe.local"
    calls = []

    def fake_webpush(**kwargs):
        calls.append(kwargs)

    monkeypatch.setattr("notifications.channels.push.webpush", fake_webpush)
    return calls
