import pytest
from django.utils import timezone
from freezegun import freeze_time

from images.models import Image
from images.tasks import (
    delete_marked_as_deleted_images_without_sent_images,
    mark_expired_images_to_be_deleted,
)
from sent_images.models import SentImage
from tests.support.factories import ImageFactory, UserFactory

pytestmark = pytest.mark.django_db


class TestMarkExpired:
    def test_marks_an_image_past_its_interval(self, settings):
        image = ImageFactory(auto_delete_after_period=True)
        later = timezone.now() + timezone.timedelta(
            hours=settings.IMAGES_AUTO_DELETE_INTERVAL_HOURS, minutes=1
        )

        with freeze_time(later):
            mark_expired_images_to_be_deleted()

        image.refresh_from_db()
        assert image.markedAsDeleted

    def test_leaves_a_fresh_image_alone(self):
        image = ImageFactory(auto_delete_after_period=True)

        mark_expired_images_to_be_deleted()

        image.refresh_from_db()
        assert not image.markedAsDeleted

    def test_leaves_an_image_without_the_flag_alone(self, settings):
        image = ImageFactory(auto_delete_after_period=False)
        later = timezone.now() + timezone.timedelta(
            hours=settings.IMAGES_AUTO_DELETE_INTERVAL_HOURS, minutes=1
        )

        with freeze_time(later):
            mark_expired_images_to_be_deleted()

        image.refresh_from_db()
        assert not image.markedAsDeleted


class TestDeleteMarked:
    def test_deletes_a_marked_image_nobody_received(self):
        image = ImageFactory(markedAsDeleted=True)

        delete_marked_as_deleted_images_without_sent_images()

        assert not Image.objects.filter(id=image.id).exists()

    def test_keeps_a_marked_image_that_was_sent(self):
        sender = UserFactory()
        image = ImageFactory(user=sender, markedAsDeleted=True)
        SentImage.objects.create(
            sender=sender,
            reciever=UserFactory(),
            image=image,
            expires_at=timezone.now() + timezone.timedelta(days=1),
        )

        delete_marked_as_deleted_images_without_sent_images()

        assert Image.objects.filter(id=image.id).exists()

    def test_keeps_an_unmarked_image(self):
        image = ImageFactory()

        delete_marked_as_deleted_images_without_sent_images()

        assert Image.objects.filter(id=image.id).exists()

    def test_reports_what_it_deleted(self):
        ImageFactory(markedAsDeleted=True)

        assert "1 images" in delete_marked_as_deleted_images_without_sent_images()
