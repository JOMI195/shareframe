import pytest
from django.core.management import call_command

from tests.support import seed
from tests.support.factories import UserFactory
from user_stats.models import UserStats

pytestmark = pytest.mark.django_db


def test_every_user_without_stats_gets_a_zeroed_row():
    user = UserFactory()

    call_command("init_user_stats", verbosity=0)

    stats = UserStats.objects.get(user=user)
    assert all(getattr(stats, field) == 0 for field in UserStats.COUNTERS)


def test_existing_counts_are_kept():
    call_command("init_user_stats", verbosity=0)

    stats = UserStats.objects.get(user__username=seed.ALICE)
    assert stats.images_sent == seed.user_stats()[seed.ALICE]["images_sent"]


def test_deleted_users_are_skipped():
    user = UserFactory()
    user.delete()

    call_command("init_user_stats", verbosity=0)

    assert not UserStats.objects.filter(user=user).exists()


def test_running_again_changes_nothing():
    call_command("init_user_stats", verbosity=0)
    before = UserStats.objects.count()

    call_command("init_user_stats", verbosity=0)

    assert UserStats.objects.count() == before
