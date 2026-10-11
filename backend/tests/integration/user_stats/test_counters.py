import pytest

from tests.support.factories import UserFactory
from user_core.models import User
from user_stats.counters import bump, record_send
from user_stats.models import UserStats

pytestmark = pytest.mark.django_db


def test_the_first_bump_creates_the_row():
    user = UserFactory()

    bump(user, "images_uploaded")

    assert UserStats.objects.get(user=user).images_uploaded == 1


def test_bumps_add_up():
    user = UserFactory()

    bump(user, "images_uploaded")
    bump(user, "images_uploaded", by=2)

    assert UserStats.objects.get(user=user).images_uploaded == 3


def test_no_user_is_ignored():
    before = UserStats.objects.count()

    bump(None, "images_uploaded")

    assert UserStats.objects.count() == before


def test_a_send_counts_for_both_sides():
    sender, reciever = UserFactory(), UserFactory()

    record_send(sender, reciever)

    assert UserStats.objects.get(user=sender).images_sent == 1
    assert UserStats.objects.get(user=reciever).images_received == 1


def test_deleting_the_account_keeps_the_counts_unlinked():
    user = UserFactory()
    bump(user, "images_uploaded")

    stats = user.stats

    user.delete()

    stats.refresh_from_db()
    assert stats.user is None
    assert stats.images_uploaded == 1


def test_a_hard_delete_keeps_the_counts_unlinked():
    user = UserFactory()
    bump(user, "images_uploaded")
    stats = user.stats

    User.objects.filter(pk=user.pk).delete()

    stats.refresh_from_db()
    assert stats.user is None
