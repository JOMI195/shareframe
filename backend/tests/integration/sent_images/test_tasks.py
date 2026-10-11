import pytest
from django.utils import timezone

from sent_images.models import SentImage, SentImageStatus
from sent_images.tasks import (
    delete_long_expired_sent_images,
    deliver_due_scheduled_sent_images,
)
from tests.support.factories import FriendshipFactory, SentImageFactory, UserFactory

pytestmark = pytest.mark.django_db


def long_ago(settings, extra_days):
    return timezone.now() - timezone.timedelta(
        days=settings.SENT_IMAGE_DELETE_DAYS + extra_days
    )


def test_deletes_an_image_expired_past_the_window(settings):
    sent = SentImageFactory(expires_at=long_ago(settings, 1))

    delete_long_expired_sent_images()

    assert not SentImage.objects.filter(id=sent.id).exists()


def test_keeps_one_that_expired_inside_the_window(settings):
    sent = SentImageFactory(expires_at=long_ago(settings, -1))

    delete_long_expired_sent_images()

    assert SentImage.objects.filter(id=sent.id).exists()


def test_keeps_an_active_one():
    sent = SentImageFactory()

    delete_long_expired_sent_images()

    assert SentImage.objects.filter(id=sent.id).exists()


def test_reports_how_many_it_deleted(settings):
    """The seed corpus carries long-expired rows of its own, so count them in."""
    threshold = timezone.now() - timezone.timedelta(
        days=settings.SENT_IMAGE_DELETE_DAYS
    )
    expected = SentImage.objects.filter(expires_at__lt=threshold).count() + 1
    SentImageFactory(expires_at=long_ago(settings, 1))

    assert (
        delete_long_expired_sent_images()
        == f"Deleted {expected} long expired sent images."
    )


class TestDeliverDue:
    @pytest.fixture
    def friends(self):
        sender = UserFactory()
        reciever = UserFactory()
        FriendshipFactory(sender=sender, reciever=reciever, status="accepted")
        return {"sender": sender, "reciever": reciever}

    def test_delivers_a_due_send(self, friends):
        due = SentImageFactory(
            **friends,
            scheduled=True,
            scheduled_for=timezone.now() - timezone.timedelta(minutes=1),
        )

        deliver_due_scheduled_sent_images()

        due.refresh_from_db()
        assert due.status == SentImageStatus.SENT

    def test_leaves_a_future_send_scheduled(self, friends):
        future = SentImageFactory(**friends, scheduled=True)

        deliver_due_scheduled_sent_images()

        future.refresh_from_db()
        assert future.status == SentImageStatus.SCHEDULED
