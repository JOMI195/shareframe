from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone

from notifications.choices import NotificationChannel, NotificationKind
from notifications.models import Notification
from notifications.tasks import send_inactivity_reminders
from notifications.triggers.inactivity import due_accounts
from sent_images.models import SentImage
from tests.support.factories import SentImageFactory, UserFactory

pytestmark = pytest.mark.django_db

KIND = NotificationKind.INACTIVITY_REMINDER


def days_ago(days):
    return timezone.now() - timedelta(days=days)


def make_account(joined_days_ago=60):
    return UserFactory(is_active=True, date_joined=days_ago(joined_days_ago)).account


def sent(account, days):
    sent_image = SentImageFactory(sender=account.user)
    SentImage.objects.filter(pk=sent_image.pk).update(sent_at=days_ago(days))


def reminded(account, days):
    notification = Notification.objects.create(
        account=account, kind=KIND, channel=NotificationChannel.EMAIL
    )
    Notification.objects.filter(pk=notification.pk).update(sent_at=days_ago(days))


def is_due(account):
    return due_accounts().filter(pk=account.pk).exists()


def test_a_long_time_member_who_never_sent_is_due():
    assert is_due(make_account())


def test_a_new_member_is_not_due():
    assert not is_due(make_account(joined_days_ago=5))


def test_a_sender_inactive_for_three_weeks_is_due():
    account = make_account()
    sent(account, 22)

    assert is_due(account)


def test_a_recent_sender_is_not_due():
    account = make_account()
    sent(account, 22)
    sent(account, 5)

    assert not is_due(account)


def test_a_reminder_is_sent_once_per_inactive_stretch():
    account = make_account()
    sent(account, 30)
    reminded(account, 8)

    assert not is_due(account)


def test_sending_again_starts_a_new_stretch():
    account = make_account()
    reminded(account, 40)
    sent(account, 25)

    assert is_due(account)


def test_a_deleted_user_is_not_due():
    account = make_account()
    account.user.is_deleted = True
    account.user.save()

    assert not is_due(account)


def test_the_task_mails_and_logs_due_accounts(enable):
    enable(NotificationChannel.EMAIL)
    account = make_account()

    send_inactivity_reminders()

    assert account.user.email in [to for m in mail.outbox for to in m.to]
    assert Notification.objects.filter(account=account, kind=KIND).exists()

    mail.outbox.clear()
    send_inactivity_reminders()

    assert account.user.email not in [to for m in mail.outbox for to in m.to]
