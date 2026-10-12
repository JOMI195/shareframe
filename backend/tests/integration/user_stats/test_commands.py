import pytest
from django.core.management import call_command

from images.models import Image
from sent_images.models import SentImage
from tests.support import seed
from tests.support.factories import ImageFactory, SentImageFactory, UserFactory
from user_core.models import User
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


def _backfill(*args):
    call_command("backfill_user_stats", *args, verbosity=0)


def test_backfill_matches_the_current_data():
    user = User.objects.get(username=seed.ALICE)

    _backfill()

    stats = UserStats.objects.get(user=user)
    assert stats.images_uploaded == Image.objects.filter(user=user).count()
    assert stats.images_sent == SentImage.objects.sent().filter(sender=user).count()
    assert (
        stats.images_received == SentImage.objects.sent().filter(reciever=user).count()
    )


def test_backfill_overwrites_existing_counts():
    sent = SentImageFactory()
    UserStats.objects.create(
        user=sent.sender, images_uploaded=99, images_sent=99, images_received=99
    )

    _backfill()

    stats = UserStats.objects.get(user=sent.sender)
    assert (stats.images_uploaded, stats.images_sent, stats.images_received) == (
        1,
        1,
        0,
    )


def test_backfill_counts_marked_as_deleted_uploads():
    image = ImageFactory(markedAsDeleted=True)

    _backfill()

    assert UserStats.objects.get(user=image.user).images_uploaded == 1


def test_backfill_skips_scheduled_sends():
    sent = SentImageFactory(scheduled=True)

    _backfill()

    assert UserStats.objects.get(user=sent.sender).images_sent == 0
    assert UserStats.objects.get(user=sent.reciever).images_received == 0


def test_backfill_creates_missing_rows():
    sent = SentImageFactory()

    _backfill()

    assert UserStats.objects.get(user=sent.reciever).images_received == 1


def test_backfill_keeps_rows_of_deleted_users():
    detached = UserStats.objects.create(user=None, images_uploaded=7)

    _backfill()

    detached.refresh_from_db()
    assert detached.images_uploaded == 7


def test_backfill_dry_run_writes_nothing():
    sent = SentImageFactory()
    UserStats.objects.create(user=sent.sender, images_sent=99)

    _backfill("--dry-run")

    assert UserStats.objects.get(user=sent.sender).images_sent == 99
    assert not UserStats.objects.filter(user=sent.reciever).exists()
