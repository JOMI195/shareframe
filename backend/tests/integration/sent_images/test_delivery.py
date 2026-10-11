import pytest
from django.utils import timezone

from images.models import Image
from sent_images.delivery import deliver_scheduled_sent_image
from sent_images.models import SentImage, SentImageStatus
from tests.support.factories import (
    FriendshipFactory,
    SentImageFactory,
    UserFactory,
)
from user_stats.models import UserStats

pytestmark = pytest.mark.django_db


@pytest.fixture
def scheduled():
    sender = UserFactory()
    reciever = UserFactory()
    FriendshipFactory(sender=sender, reciever=reciever, status="accepted")
    return SentImageFactory(sender=sender, reciever=reciever, scheduled=True)


def test_marks_it_sent_now(scheduled):
    before = timezone.now()

    deliver_scheduled_sent_image(scheduled.id, early=False)

    scheduled.refresh_from_db()
    assert scheduled.status == SentImageStatus.SENT
    assert scheduled.sent_at >= before


def test_on_time_keeps_the_expiry(scheduled):
    expires_at = scheduled.expires_at

    deliver_scheduled_sent_image(scheduled.id, early=False)

    scheduled.refresh_from_db()
    assert scheduled.expires_at == expires_at


def test_early_keeps_the_chosen_duration(scheduled):
    duration = scheduled.expires_at - scheduled.scheduled_for

    deliver_scheduled_sent_image(scheduled.id, early=True)

    scheduled.refresh_from_db()
    remaining = scheduled.expires_at - scheduled.sent_at
    assert remaining == duration


def test_pushes_after_commit(scheduled, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks() as callbacks:
        deliver_scheduled_sent_image(scheduled.id, early=False)

    assert len(callbacks) == 1


def test_an_image_auto_deleted_meanwhile_is_still_delivered(scheduled):
    Image.objects.filter(pk=scheduled.image_id).update(markedAsDeleted=True)

    assert deliver_scheduled_sent_image(scheduled.id, early=False) is not None


def test_an_already_sent_one_is_left_alone():
    sent = SentImageFactory()

    assert deliver_scheduled_sent_image(sent.id, early=True) is None


def test_sending_to_yourself_needs_no_friendship():
    me = UserFactory()
    scheduled = SentImageFactory(sender=me, reciever=me, scheduled=True)

    assert deliver_scheduled_sent_image(scheduled.id, early=False) is not None


def test_a_send_to_a_former_friend_is_dropped():
    scheduled = SentImageFactory(scheduled=True)

    assert deliver_scheduled_sent_image(scheduled.id, early=False) is None
    assert not SentImage.objects.filter(id=scheduled.id).exists()


def test_counts_the_send_for_both_sides(scheduled):
    deliver_scheduled_sent_image(scheduled.id, early=False)

    assert UserStats.objects.get(user=scheduled.sender).images_sent == 1
    assert UserStats.objects.get(user=scheduled.reciever).images_received == 1


def test_a_dropped_send_is_not_counted():
    scheduled = SentImageFactory(scheduled=True)

    deliver_scheduled_sent_image(scheduled.id, early=False)

    assert not UserStats.objects.filter(
        user__in=[scheduled.sender, scheduled.reciever]
    ).exists()
