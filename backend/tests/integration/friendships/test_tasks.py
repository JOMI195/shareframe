import pytest
from django.utils import timezone
from freezegun import freeze_time

from friendships.tasks import reject_long_pending_friendship_requestes
from tests.support.factories import FriendshipFactory

pytestmark = pytest.mark.django_db


def stale():
    with freeze_time(timezone.now() - timezone.timedelta(days=31)):
        return FriendshipFactory(status="pending")


def test_counts_the_stale_requests():
    stale()

    assert reject_long_pending_friendship_requestes().startswith("Reject 1 ")


def test_a_recent_request_is_not_counted():
    FriendshipFactory(status="pending")

    assert reject_long_pending_friendship_requestes().startswith("Reject 0 ")


def test_an_accepted_request_is_not_counted():
    with freeze_time(timezone.now() - timezone.timedelta(days=31)):
        FriendshipFactory(status="accepted")

    assert reject_long_pending_friendship_requestes().startswith("Reject 0 ")


def test_the_stale_request_is_rejected():
    friendship = stale()

    reject_long_pending_friendship_requestes()

    friendship.refresh_from_db()
    assert friendship.status == "rejected"


def test_a_recent_request_is_left_alone():
    friendship = FriendshipFactory(status="pending")

    reject_long_pending_friendship_requestes()

    friendship.refresh_from_db()
    assert friendship.status == "pending"


def test_the_rejection_is_timestamped():
    friendship = stale()

    reject_long_pending_friendship_requestes()

    before = friendship.updated_at
    friendship.refresh_from_db()
    assert friendship.updated_at > before
