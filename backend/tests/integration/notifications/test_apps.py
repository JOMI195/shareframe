import pytest
from django.apps import apps

from notifications.apps import ensure_channel_settings
from notifications.choices import NotificationChannel, NotificationKind
from notifications.models import ChannelSetting

pytestmark = pytest.mark.django_db


def _run():
    ensure_channel_settings(sender=apps.get_app_config("notifications"))


def test_every_kind_and_channel_gets_a_disabled_row():
    ChannelSetting.objects.all().delete()

    _run()

    assert ChannelSetting.objects.count() == len(NotificationKind.values) * len(
        NotificationChannel.values
    )
    assert not ChannelSetting.objects.filter(enabled=True).exists()


def test_an_enabled_row_stays_enabled():
    ChannelSetting.objects.update(enabled=True)

    _run()

    assert not ChannelSetting.objects.filter(enabled=False).exists()
