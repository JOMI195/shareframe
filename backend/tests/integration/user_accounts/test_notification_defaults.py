import pytest
from django.core.management import call_command

from notifications.choices import NotificationChannel, NotificationKind
from tests.support.factories import UserFactory
from user_accounts.models import NotificationKindPreference, NotificationPreference

pytestmark = pytest.mark.django_db

KIND = NotificationKind.INACTIVITY_REMINDER
EMAIL = NotificationChannel.EMAIL


def rows(account):
    return (
        list(NotificationKindPreference.objects.filter(account=account)),
        list(NotificationPreference.objects.filter(account=account)),
    )


def drop_rows(account):
    NotificationKindPreference.objects.filter(account=account).delete()
    NotificationPreference.objects.filter(account=account).delete()


def test_a_new_account_gets_every_kind_and_channel_switched_on():
    kinds, channels = rows(UserFactory().account)

    assert len(kinds) == len(NotificationKind.values)
    assert len(channels) == len(NotificationKind.values) * len(
        NotificationChannel.values
    )
    assert all(row.enabled for row in kinds + channels)


def test_a_missing_row_counts_as_off():
    account = UserFactory().account
    drop_rows(account)

    assert not NotificationKindPreference.is_enabled(account, KIND)
    assert not NotificationPreference.is_enabled(account, KIND, EMAIL)


class TestCommand:
    def test_an_account_without_rows_gets_everything_on(self):
        account = UserFactory().account
        drop_rows(account)

        call_command("create_notification_preferences", verbosity=0)

        kinds, channels = rows(account)
        assert len(kinds) == len(NotificationKind.values)
        assert len(channels) == len(NotificationKind.values) * len(
            NotificationChannel.values
        )
        assert all(row.enabled for row in kinds + channels)

    def test_a_kind_added_later_is_on(self):
        account = UserFactory().account
        NotificationKindPreference.objects.filter(account=account, kind=KIND).delete()
        NotificationPreference.objects.filter(account=account, kind=KIND).delete()

        call_command("create_notification_preferences", verbosity=0)

        assert NotificationKindPreference.is_enabled(account, KIND)
        assert NotificationPreference.is_enabled(account, KIND, EMAIL)

    def test_keeps_existing_choices(self):
        account = UserFactory().account
        NotificationPreference.objects.filter(
            account=account, kind=KIND, channel=EMAIL
        ).update(enabled=False)

        call_command("create_notification_preferences", verbosity=0)

        assert not NotificationPreference.is_enabled(account, KIND, EMAIL)
